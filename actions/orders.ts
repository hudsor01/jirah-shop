"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Order, OrderStatus } from "@/types/database";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { uuidSchema, paginationSchema } from "@/lib/validations";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import {
  queryAdminOrders,
  queryAdminOrder,
  queryRecentOrders,
  queryOrderStats,
  querySalesData,
} from "@/queries/orders";
import type { QueryOrderWithItems } from "@/queries/orders";
import { notifyOrderStatusUpdate } from "@/lib/email-notifications";

// ─── Zod Schemas ─────────────────────────────────────────

const AdminOrdersOptionsSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
});

const OrderStatusSchema = z.enum(["pending", "paid", "shipped", "delivered", "cancelled", "refunded"]);

const SalesDaysSchema = z.number().int().min(1).max(365);

// ─── Actions ─────────────────────────────────────────────

export type OrderWithItems = QueryOrderWithItems;

export async function getAdminOrders(options?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ orders: Order[]; count: number }>> {
  await requireAdmin();

  const optionsParsed = AdminOrdersOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return ok({ orders: [], count: 0 });
  }

  try {
    const result = await queryAdminOrders(options);
    return ok(result);
  } catch (e) {
    logger.error("Error fetching orders", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch orders");
  }
}

export async function getAdminOrder(
  id: string
): Promise<ActionResult<OrderWithItems | null>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return ok(null);
  }

  try {
    const result = await queryAdminOrder(id);
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch order");
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid order ID");
  }
  const statusParsed = OrderStatusSchema.safeParse(status);
  if (!statusParsed.success) {
    return fail("Invalid order status");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }

  // Send status update email for customer-facing statuses
  const emailStatuses = ["shipped", "delivered", "cancelled", "refunded"];
  if (emailStatuses.includes(status)) {
    const { data: orderData } = await supabase
      .from("orders")
      .select("email, id")
      .eq("id", id)
      .single();

    if (orderData?.email) {
      notifyOrderStatusUpdate(orderData.email, {
        orderNumber: orderData.id,
        customerName: orderData.email,
        newStatus: status,
      }).catch(() => {
        // Email failures are already logged inside sendEmail — swallow here
      });
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account");

  return ok(undefined);
}

export async function getOrderStats(): Promise<ActionResult<{
  totalRevenue: number;
  ordersToday: number;
  totalCustomers: number;
  lowStockProducts: number;
}>> {
  await requireAdmin();

  try {
    const result = await queryOrderStats();
    return ok(result);
  } catch (e) {
    logger.error("Error fetching dashboard stats", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch dashboard stats");
  }
}

export async function getRecentOrders(): Promise<ActionResult<Order[]>> {
  await requireAdmin();

  try {
    const result = await queryRecentOrders();
    return ok(result);
  } catch (e) {
    logger.error("Error fetching recent orders", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch recent orders");
  }
}

/**
 * Retrieves daily sales analytics for the admin dashboard.
 *
 * Validates admin auth and days parameter (1-365), then calls the
 * querySalesData function which executes the get_sales_analytics Postgres
 * RPC with the specified date range.
 *
 * @param days - Number of days to look back (1-365, defaults to 30)
 * @returns ActionResult<Array<{ date: string; revenue: number; orders: number }>> -
 *   Daily revenue and order count aggregates on success. Possible errors:
 *   "Invalid days parameter", "Failed to fetch sales data"
 *
 * @sideeffects
 * - Calls Supabase RPC get_sales_analytics with date range
 */
export async function getSalesData(
  days: number = 30
): Promise<ActionResult<{ date: string; revenue: number; orders: number }[]>> {
  await requireAdmin();

  const daysParsed = SalesDaysSchema.safeParse(days);
  if (!daysParsed.success) {
    return fail("Invalid days parameter");
  }

  try {
    const result = await querySalesData(days);
    return ok(result);
  } catch (e) {
    logger.error("Error fetching sales analytics", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch sales data");
  }
}
