import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowHalf?: boolean;
  showLabel?: boolean;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md', 
  allowHalf = true,
  showLabel = true 
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  const displayRating = hoveredRating || rating;

  const handleClick = (star: number, isHalf: boolean) => {
    if (readonly) return;
    const newRating = allowHalf && isHalf ? star - 0.5 : star;
    setIsAnimating(true);
    onRatingChange?.(newRating);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleMouseMove = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (readonly || !allowHalf) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoveredRating(isHalf ? star - 0.5 : star);
  };

  const handleMouseEnter = (star: number) => {
    if (readonly) return;
    if (!allowHalf) {
      setHoveredRating(star);
    }
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 0) return 'Not rated';
    if (rating <= 1) return 'Poor';
    if (rating <= 2) return 'Fair';
    if (rating <= 3) return 'Good';
    if (rating <= 4) return 'Great';
    return 'Excellent';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-0.5 ${isAnimating ? 'scale-110' : ''} transition-transform duration-300`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHalfFilled = allowHalf && star - 0.5 === displayRating;
          
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={(e) => {
                if (!allowHalf) {
                  handleClick(star, false);
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isHalf = x < rect.width / 2;
                handleClick(star, isHalf);
              }}
              onMouseMove={(e) => handleMouseMove(star, e)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={() => !readonly && setHoveredRating(0)}
              className={`${
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125 active:scale-95'
              } transition-all duration-200 relative p-0.5`}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              {isHalfFilled ? (
                <div className="relative">
                  <Star className={`${sizeClasses[size]} fill-none text-gray-300 dark:text-gray-600 transition-colors`} />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                    <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400 drop-shadow-md`} />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${sizeClasses[size]} ${
                    isFilled
                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-md'
                      : 'fill-none text-gray-300 dark:text-gray-600'
                  } transition-all duration-200`}
                />
              )}
            </button>
          );
        })}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {displayRating > 0 ? displayRating.toFixed(1) : '—'}
          </span>
          {!readonly && hoveredRating > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getRatingLabel(hoveredRating)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface TrackRatingProps {
  trackId: string;
  trackName: string;
  initialRating?: number;
  onRate?: (rating: number) => void;
}

export function TrackRating({ trackId, trackName, initialRating = 0, onRate }: TrackRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);
    setIsSaving(true);

    try {
      onRate?.(newRating);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <StarRating
        rating={rating}
        onRatingChange={handleRatingChange}
        showLabel={false}
      />
      <div className="min-w-[80px] text-right">
        {isSaving && (
          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <span className="animate-spin">⏳</span> Saving...
          </span>
        )}
        {justSaved && !isSaving && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-fade-in">
            ✓ Saved
          </span>
        )}
        {!isSaving && !justSaved && rating > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {rating.toFixed(1)} ⭐
          </span>
        )}
      </div>
    </div>
  );
}
