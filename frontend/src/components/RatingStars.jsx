import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const RatingStars = ({ rating, size = 16, reviewCount }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<Star key={i} size={size} className="fill-amber-400 text-amber-400" />);
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(<StarHalf key={i} size={size} className="fill-amber-400 text-amber-400" />);
    } else {
      stars.push(<Star key={i} size={size} className="text-slate-600 fill-slate-800" />);
    }
  }

  return (
    <div className="flex items-center gap-1.5 font-sans">
      <div className="flex">{stars}</div>
      {reviewCount !== undefined && (
        <span className="text-xs text-slate-400">({reviewCount})</span>
      )}
    </div>
  );
};

export default RatingStars;
