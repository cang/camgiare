import type { Product } from '@/payload-types'

import { Aperture, Tag } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'

type Props = {
  priority?: boolean
  product: Partial<Product>
}

// Ảnh sản phẩm cào từ vuhoangtelecom.vn đã có sẵn badge thông số (vd "4MP") nhúng
// trong ảnh gốc — lấy lại từ tiêu đề để hiện chip gọn, không cần parse mô tả dài.
const getResolutionLabel = (title?: string | null) => {
  const match = title?.match(/(\d+(?:\.\d+)?\s?MP)/i)
  return match ? match[0].replace(/\s+/, '') : undefined
}

export const ProductGridItem: React.FC<Props> = ({ priority, product }) => {
  const { gallery, priceInVND, title } = product

  let price = priceInVND

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInVND &&
      typeof variant.priceInVND === 'number'
    ) {
      price = variant.priceInVND
    }
  }

  const compareAtPrice =
    typeof product.compareAtPriceInVND === 'number' ? product.compareAtPriceInVND : undefined
  const discountPercent =
    compareAtPrice && typeof price === 'number' && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : undefined

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  const brand = product.brand && typeof product.brand === 'object' ? product.brand : undefined
  const category = product.categories?.find((item) => typeof item === 'object') as
    | { title?: string }
    | undefined
  const resolution = getResolutionLabel(title)

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-primary-foreground p-8">
        {Boolean(discountPercent) && (
          <span className="absolute right-2 top-2 z-10 rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground">
            -{discountPercent}%
          </span>
        )}
        {image ? (
          <Media
            className="relative h-full w-full"
            fill
            imgClassName={clsx('h-full w-full object-contain rounded-2xl', {
              'transition duration-300 ease-in-out group-hover:scale-102': true,
            })}
            priority={priority}
            resource={image}
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        {brand?.name && (
          <div className="font-mono text-xs font-semibold text-primary">{brand.name}</div>
        )}
        <div className="line-clamp-2 text-sm font-medium leading-snug">{title}</div>

        {(resolution || category?.title) && (
          <div className="flex flex-wrap gap-1.5">
            {resolution && (
              <span className="inline-flex items-center gap-1 rounded bg-card px-1.5 py-0.5 text-xs text-muted-foreground">
                <Aperture className="h-3 w-3 text-primary" />
                {resolution}
              </span>
            )}
            {category?.title && (
              <span className="inline-flex items-center gap-1 rounded bg-card px-1.5 py-0.5 text-xs text-muted-foreground">
                <Tag className="h-3 w-3 text-primary" />
                {category.title}
              </span>
            )}
          </div>
        )}

        <div className="mt-0.5 flex items-baseline gap-2 font-mono">
          {typeof price === 'number' ? (
            <Price amount={price} className="text-primary/50 group-hover:text-primary" />
          ) : (
            <div className="text-sm">Liên hệ</div>
          )}
          {typeof compareAtPrice === 'number' && (
            <Price
              amount={compareAtPrice}
              className="text-xs text-muted-foreground line-through"
            />
          )}
        </div>
      </div>
    </Link>
  )
}
