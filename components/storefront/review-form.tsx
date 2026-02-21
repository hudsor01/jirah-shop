"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/actions/reviews";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const displayRating = hoveredRating || rating;

  function handleSubmit(formData: FormData) {
    if (rating === 0) {
      setMessage({ type: "error", text: "Please select a star rating." });
      return;
    }

    formData.set("product_id", productId);
    formData.set("rating", String(rating));

    startTransition(async () => {
      const result = await submitReview(formData);

      if (result.success) {
        setMessage({
          type: "success",
          text: "Thank you! Your review is pending approval.",
        });
        setRating(0);
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "Something went wrong. Please try again.",
        });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {/* Star Rating Selector */}
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const starValue = i + 1;
            const isFilled = displayRating >= starValue;

            return (
              <button
                key={i}
                type="button"
                aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                className="cursor-pointer p-0.5 transition-transform hover:scale-110"
                onClick={() => {
                  setRating(starValue);
                  setMessage(null);
                }}
                onMouseEnter={() => setHoveredRating(starValue)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <Star
                  className={cn(
                    "size-7",
                    isFilled
                      ? "text-yellow-500"
                      : "text-muted-foreground/30"
                  )}
                  fill={isFilled ? "currentColor" : "currentColor"}
                  strokeWidth={0}
                />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} of 5
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          name="title"
          placeholder="Summarize your experience"
          disabled={isPending}
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="review-comment">Your Review</Label>
        <Textarea
          id="review-comment"
          name="comment"
          placeholder="What did you like or dislike about this product?"
          required
          rows={4}
          disabled={isPending}
        />
      </div>

      {/* Feedback Message */}
      {message && (
        <p
          className={cn(
            "text-sm font-medium",
            message.type === "success"
              ? "text-green-600"
              : "text-destructive"
          )}
        >
          {message.text}
        </p>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
