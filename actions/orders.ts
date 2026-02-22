"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { toNum } from "@/lib/utils";
import { normalizeOrder, normalizeOrderItem } from "@/lib/normalize";
import { parsePagination } from "@/lib/pagination";
import type { Order, OrderItem, OrderStatus } from "@/types/database";
import { requireAdmin, sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";

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

  // Total revenue from paid/shipped/delivered orders
  const { data: revenueData } = await supabase
    .from("orders")
    .select("total")
    .in("status", ["paid", "shipped", "delivered"]);

  const totalRevenue =
    revenueData?.reduce((sum, o) => sum + toNum(o.total), 0) ?? 0;

  // Orders today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: ordersToday } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // Total customers
  const { count: totalCustomers } = await supabase
    .from("customer_profiles")
    .select("*", { count: "exact", head: true });

  // Low stock products (under 10 units)
  const { count: lowStockProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .lt("stock_quantity", LOW_STOCK_THRESHOLD);

  return {
    totalRevenue,
    ordersToday: ordersToday ?? 0,
    totalCustomers: totalCustomers ?? 0,
    lowStockProducts: lowStockProducts ?? 0,
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
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from("orders")
    .select("total, created_at")
    .in("status", ["paid", "shipped", "delivered"])
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Group by date
  const grouped: Record<string, { revenue: number; orders: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    grouped[dateStr] = { revenue: 0, orders: 0 };
  }

  data?.forEach((order) => {
    const dateStr = new Date(order.created_at).toISOString().split("T")[0];
    if (grouped[dateStr]) {
      grouped[dateStr].revenue += toNum(order.total);
      grouped[dateStr].orders += 1;
    }
  });

  return Object.entries(grouped).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}
