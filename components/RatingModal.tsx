"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { StarRating } from "./StarRating";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rating: number, review?: string) => Promise<void>;
  itemName: string;
  initialRating?: number;
  initialReview?: string;
}

export function RatingModal({
  isOpen,
  onClose,
  onSave,
  itemName,
  initialRating = 0,
  initialReview = "",
}: RatingModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRating(initialRating);
    setReview(initialReview);
  }, [initialRating, initialReview, isOpen]);

  const handleSave = async () => {
    if (rating === 0) return;

    setIsSaving(true);
    try {
      await onSave(rating, review);
      onClose();
    } catch (error) {
      console.error("Error saving rating:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Rate & Review
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Item Name */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {itemName}
            </h3>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Your Rating
            </label>
            <div className="flex justify-center">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
                showLabel={true}
              />
            </div>
          </div>

          {/* Review */}
          <div>
            <label
              htmlFor="review"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Review (Optional)
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Share your thoughts about this music..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {review.length}/500
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={rating === 0 || isSaving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
