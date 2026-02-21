import { getAdminCoupons } from "@/actions/coupons";
import { CouponsClient } from "./coupons-client";

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page } = await searchParams;
  const currentPage = parseInt(page ?? "1");
  const pageSize = 20;

  const { coupons, count } = await getAdminCoupons({
    search,
    page: currentPage,
    limit: pageSize,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Manage discount codes ({count} total)
        </p>
      </div>

      <CouponsClient
        coupons={coupons}
        totalCount={count}
        currentPage={currentPage}
        pageSize={pageSize}
        initialSearch={search ?? ""}
      />
    </div>
  );
}
