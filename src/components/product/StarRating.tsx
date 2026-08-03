import { Star } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  rating: number
  size?: 'sm' | 'md'
  className?: string
}

export const StarRating: React.FC<Props> = ({ rating, size = 'sm', className }) => {
  const sizeClass = size === 'md' ? 'size-5' : 'size-4'

  return (
    <div aria-label={`${rating} trên 5 sao`} className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          className={cn(
            sizeClass,
            star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-primary/20',
          )}
          key={star}
        />
      ))}
    </div>
  )
}
