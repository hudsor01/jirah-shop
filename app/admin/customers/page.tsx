import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchInput } from "@/lib/auth";

import { CustomersClient } from "./customers-client";

type CustomerRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  order_count: number;
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page } = await searchParams;
  const currentPage = parseInt(page ?? "1");
  const pageSize = 20;
  const offset = (currentPage - 1) * pageSize;

  const supabase = await createClient();

  // Query customers with order count
  let query = supabase
    .from("customer_profiles")
    .select("*", { count: "exact" });

  if (search) {
    const s = sanitizeSearchInput(search);
    query = query.or(
      `full_name.ilike.%${s}%,email.ilike.%${s}%`
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data: customers, count } = await query;
  const totalCount = count ?? 0;

  // Get order counts for each customer via a single grouped query.
  // This is NOT N+1: one query fetches all user_ids for the page's customers,
  // then JS reduce groups them into per-customer counts. Only the user_id column
  // is selected, keeping the payload lightweight.
  const customerIds = customers?.map((c) => c.id) ?? [];
  let orderCounts: Record<string, number> = {};

  if (customerIds.length > 0) {
    const { data: orderData } = await supabase
      .from("orders")
      .select("user_id")
      .in("user_id", customerIds);

    if (orderData) {
      orderCounts = orderData.reduce(
        (acc: Record<string, number>, order) => {
          if (order.user_id) {
            acc[order.user_id] = (acc[order.user_id] ?? 0) + 1;
          }
          return acc;
        },
        {}
      );
    }
  }

  const customerRows: CustomerRow[] = (customers ?? []).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    created_at: c.created_at,
    order_count: orderCounts[c.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Registered customers ({totalCount} total)
        </p>
      </div>

      <CustomersClient
        customers={customerRows}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        initialSearch={search ?? ""}
      />
    </div>
  );
}
