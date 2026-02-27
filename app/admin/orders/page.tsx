import { getAdminOrders } from "@/actions/orders";
import { OrderTable } from "@/components/admin/order-table";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const { search, status, page } = await searchParams;
  const currentPage = parseInt(page ?? "1");
  const pageSize = 20;

  const result = await getAdminOrders({
    search,
    status,
    page: currentPage,
    limit: pageSize,
  });
  const { orders, count } = result.success
    ? result.data
    : { orders: [], count: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer orders ({count} total)
        </p>
      </div>

      <OrderTable
        orders={orders}
        totalCount={count}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
