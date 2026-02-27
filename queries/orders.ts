import { createClient } from "@/lib/supabase/server";
import { normalizeOrder, normalizeOrderItem } from "@/lib/normalize";
import { sanitizeSearchInput } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";
import type { Order, OrderItem } from "@/types/database";

export type QueryOrderWithItems = Order & {
  items: OrderItem[];
};

// ─── Admin Queries ───────────────────────────────────────

export async function queryAdminOrders(options?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: Order[]; count: number }> {
  const supabase = await createClient();
  const { from, to } = parsePagination(options);

  let query = supabase.from("orders").select("*", { count: "exact" });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.search) {
    const s = sanitizeSearchInput(options.search);
    query = query.or(
      `email.ilike.%${s}%,id.ilike.%${s}%`
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    orders: (data ?? []).map((o) => normalizeOrder(o as Record<string, unknown>)),
    count: count ?? 0,
  };
}

export async function queryAdminOrder(
  id: string
): Promise<QueryOrderWithItems | null> {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    return null;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  return {
    ...normalizeOrder(order as Record<string, unknown>),
    items: (items ?? []).map((i) => normalizeOrderItem(i as Record<string, unknown>)),
  };
}

export async function queryRecentOrders(): Promise<Order[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((o) => normalizeOrder(o as Record<string, unknown>));
}

// ─── Dashboard / Analytics Queries ───────────────────────

export async function queryOrderStats(): Promise<{
  totalRevenue: number;
  ordersToday: number;
  totalCustomers: number;
  lowStockProducts: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error || !data) {
    throw error ?? new Error("Failed to fetch dashboard stats");
  }

  return {
    totalRevenue: Number(data.total_revenue) || 0,
    ordersToday: Number(data.orders_today) || 0,
    totalCustomers: Number(data.total_customers) || 0,
    lowStockProducts: Number(data.low_stock_products) || 0,
  };
}

export async function querySalesData(
  days: number = 30
): Promise<{ date: string; revenue: number; orders: number }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_sales_analytics", {
    p_days: days,
  });

  if (error) throw error;

  // Build date map with all dates in range (fill gaps for chart display)
  const grouped: Record<string, { revenue: number; orders: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    grouped[dateStr] = { revenue: 0, orders: 0 };
  }

  // Fill from RPC results
  data?.forEach(
    (row: { date: string; order_count: number; revenue: number }) => {
      const dateStr =
        typeof row.date === "string"
          ? row.date
          : new Date(row.date).toISOString().split("T")[0];
      if (grouped[dateStr]) {
        grouped[dateStr].revenue = Number(row.revenue) || 0;
        grouped[dateStr].orders = Number(row.order_count) || 0;
      }
    }
  );

  return Object.entries(grouped).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}
