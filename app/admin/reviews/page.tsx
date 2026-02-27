import { getAdminReviews } from "@/actions/reviews";
import { ReviewsClient } from "./reviews-client";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const currentPage = parseInt(page ?? "1");
  const pageSize = 20;
  const filterStatus =
    status === "approved" || status === "pending" ? status : "all";

  const result = await getAdminReviews({
    status: filterStatus,
    page: currentPage,
    limit: pageSize,
  });
  const { reviews, count } = result.success
    ? result.data
    : { reviews: [], count: 0 };

  const pendingCount = filterStatus === "all"
    ? reviews.filter((r) => !r.is_approved).length
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Moderate customer product reviews ({count} total)
        </p>
      </div>

      <ReviewsClient
        reviews={reviews}
        totalCount={count}
        currentPage={currentPage}
        pageSize={pageSize}
        currentStatus={filterStatus}
        pendingCount={pendingCount}
      />
    </div>
  );
}
