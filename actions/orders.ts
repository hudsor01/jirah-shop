"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeOrder, normalizeOrderItem } from "@/lib/normalize";
import { parsePagination } from "@/lib/pagination";
import type { Order, OrderItem, OrderStatus } from "@/types/database";
import { requireAdmin, sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { uuidSchema, paginationSchema } from "@/lib/validations";

// ─── Zod Schemas ─────────────────────────────────────────

const AdminOrdersOptionsSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
});

const OrderStatusSchema = z.enum(["pending", "paid", "shipped", "delivered", "cancelled", "refunded"]);

const SalesDaysSchema = z.number().int().min(1).max(365);

// ─── Actions ─────────────────────────────────────────────

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export async function getAdminOrders(options?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: Order[]; count: number }> {
  await requireAdmin();

  const optionsParsed = AdminOrdersOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return { orders: [], count: 0 };
  }

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

  if (error) {
    logger.error("Error fetching orders", { error: error.message });
    return { orders: [], count: 0 };
  }

  return { orders: (data ?? []).map((o) => normalizeOrder(o as Record<string, unknown>)), count: count ?? 0 };
}

export async function getAdminOrder(
  id: string
): Promise<OrderWithItems | null> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return null;
  }

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

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid order ID" };
  }
  const statusParsed = OrderStatusSchema.safeParse(status);
  if (!statusParsed.success) {
    return { success: false, error: "Invalid order status" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account");

  return { success: true };
}

export async function getOrderStats(): Promise<{
  totalRevenue: number;
  ordersToday: number;
  totalCustomers: number;
  lowStockProducts: number;
}> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error || !data) {
    logger.error("Error fetching dashboard stats", { error: error?.message });
    return {
      totalRevenue: 0,
      ordersToday: 0,
      totalCustomers: 0,
      lowStockProducts: 0,
    };
  }

  return {
    totalRevenue: Number(data.total_revenue) || 0,
    ordersToday: Number(data.orders_today) || 0,
    totalCustomers: Number(data.total_customers) || 0,
    lowStockProducts: Number(data.low_stock_products) || 0,
  };
}

export async function getRecentOrders(): Promise<Order[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    logger.error("Error fetching recent orders", { error: error.message });
    return [];
  }

  return (data ?? []).map((o) => normalizeOrder(o as Record<string, unknown>));
}

export async function getSalesData(
  days: number = 30
): Promise<{ date: string; revenue: number; orders: number }[]> {
  await requireAdmin();

  const daysParsed = SalesDaysSchema.safeParse(days);
  if (!daysParsed.success) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_sales_analytics", {
    p_days: days,
  });

  if (error) {
    logger.error("Error fetching sales analytics", { error: error.message });
    return [];
  }

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
