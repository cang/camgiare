import type { Brand } from '@/payload-types'

import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'

type Props = {
  brand: Brand
}

export const BrandInfo: React.FC<Props> = ({ brand }) => {
  return (
    <div>
      <h2 className="mb-3 text-lg font-medium">Thông tin hãng sản xuất</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {brand.logo && typeof brand.logo === 'object' && (
          <Media
            className="relative h-16 w-24 shrink-0"
            imgClassName="h-full w-full object-contain"
            resource={brand.logo}
          />
        )}
        <div className="flex flex-col gap-2">
          <span className="font-medium">{brand.name}</span>
          {brand.description && <p className="text-sm text-primary/70">{brand.description}</p>}
          <Link
            className="text-sm text-primary underline underline-offset-4 hover:no-underline"
            href={`/shop?brand=${brand.slug}`}
          >
            Xem tất cả sản phẩm {brand.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
