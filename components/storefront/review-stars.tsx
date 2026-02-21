import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-6",
} as const;

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

interface ReviewStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function ReviewStars({
  rating,
  size = "md",
  showValue = false,
}: ReviewStarsProps) {
  const iconSize = sizeMap[size];
  const textSize = textSizeMap[size];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => {
          const starIndex = i + 1;
          const filled = rating >= starIndex;
          const halfFilled = !filled && rating >= starIndex - 0.5;

          return (
            <span key={i} className="relative">
              {/* Background empty star */}
              <Star
                className={cn(iconSize, "text-muted-foreground/30")}
                fill="currentColor"
                strokeWidth={0}
              />
              {/* Filled overlay */}
              {(filled || halfFilled) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <Star
                    className={cn(iconSize, "text-yellow-500")}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className={cn(textSize, "font-medium text-foreground ml-1")}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
