"use client";

import { useState } from "react";

interface ReviewStarsProps {
  mode: "readonly" | "interactive";
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

export default function ReviewStars({
  mode,
  value,
  onChange,
  size = "md",
}: ReviewStarsProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-10 w-10",
  };

  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-2",
  };

  const starSize = sizeClasses[size];
  const displayValue = mode === "interactive" && hoverValue > 0 ? hoverValue : value;

  return (
    <div className={`flex ${gapClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;

        if (mode === "readonly") {
          return (
            <svg
              key={star}
              className={`${starSize} ${filled ? "text-yellow-400" : "text-gray-200"}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        }

        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange?.(star)}
            className={`${starSize} min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-110`}
          >
            <svg
              className={`${starSize} ${filled ? "text-yellow-400" : "text-gray-300"} transition-colors`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
