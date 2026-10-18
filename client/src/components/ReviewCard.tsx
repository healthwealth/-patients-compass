import React from "react";
import { Star, CheckCircle } from "lucide-react";

interface ReviewCardProps {
  author: string;
  rating: number;
  text: string;
  verified: boolean;
}

export function ReviewCard({ author, rating, text, verified }: ReviewCardProps) {
  return (
    <div className="border border-[#E8E4DC] rounded-lg p-4 bg-[#FEFDFB] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-[#2C2A29]">{author}</p>
            {verified && (
              <CheckCircle className="w-4 h-4 text-[#7E9A85]" aria-label="Verified Purchase" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < rating ? "fill-[#D4A574] text-[#D4A574]" : "text-[#D1C7BD]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-[#5C5854] leading-relaxed line-clamp-3">{text}</p>
    </div>
  );
}
