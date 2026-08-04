import type { TrustBadgesBlock as TrustBadgesBlockProps } from '@/payload-types'

import { MapPin, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import React from 'react'

const icons = {
  mapPin: MapPin,
  refresh: RotateCcw,
  shield: ShieldCheck,
  truck: Truck,
}

export const TrustBadgesBlock: React.FC<
  TrustBadgesBlockProps & {
    id?: string | number
  }
> = ({ items }) => {
  if (!Array.isArray(items) || items.length === 0) return null

  return (
    <div className="container">
      <div className="grid divide-y border-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = icons[item.icon as keyof typeof icons] || Truck

          return (
            <div
              className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-muted-foreground"
              key={i}
            >
              <Icon className="h-4 w-4 text-primary" />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
