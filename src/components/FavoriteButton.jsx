// Favorite Button Component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useFavoriteStatus } from '@/lib/favorites';
import { toast } from 'sonner';

export default function FavoriteButton({
  type,
  item,
  size = 'default',
  showLabel = false,
  className = ''
}) {
  const { isFavorite, toggle } = useFavoriteStatus(type, item.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const wasAdded = toggle(item);

    if (wasAdded) {
      toast.success(`Added to favorites!`, {
        description: item.title || item.name
      });
    } else {
      toast.success(`Removed from favorites`);
    }
  };

  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        transition-colors
        ${isFavorite
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600'
        }
        ${showLabel ? 'px-4 gap-2 w-auto' : ''}
        ${className}
      `}
      whileTap={{ scale: 0.9 }}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? 'filled' : 'empty'}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''}`}
          />
        </motion.div>
      </AnimatePresence>

      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Saved' : 'Save'}
        </span>
      )}

      {/* Burst animation on favorite */}
      <AnimatePresence>
        {isFavorite && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-full h-full rounded-full border-2 border-red-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Inline favorite icon for lists
export function FavoriteIcon({
  type,
  item,
  size = 'small',
  className = ''
}) {
  const { isFavorite, toggle } = useFavoriteStatus(type, item.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(item);
  };

  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <button
      onClick={handleClick}
      className={`${className} transition-colors`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`
          ${sizeClasses[size]}
          ${isFavorite
            ? 'text-red-500 fill-current'
            : 'text-stone-300 hover:text-red-400'
          }
        `}
      />
    </button>
  );
}
