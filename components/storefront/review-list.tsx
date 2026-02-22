import { getProductReviews } from "@/actions/reviews";
import { ReviewStars } from "@/components/storefront/review-stars";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateLong } from "@/lib/format";

interface ReviewListProps {
  productId: string;
}

export async function ReviewList({ productId }: ReviewListProps) {
  const { data: reviews, error } = await getProductReviews(productId);

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        Unable to load reviews at this time.
      </p>
    );
  }

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <ReviewStars rating={averageRating} size="lg" showValue />
        <span className="text-sm text-muted-foreground">
          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>

      <Separator />

      {/* Reviews */}
      {totalReviews === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No reviews yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="py-4">
              <CardContent className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Anonymous
                      </span>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <ReviewStars rating={review.rating} size="sm" />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateLong(review.created_at)}
                  </span>
                </div>

                {/* Title & Comment */}
                {review.title && (
                  <p className="font-semibold text-foreground">
                    {review.title}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.comment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
