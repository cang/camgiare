import type { Product, Variant } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'

type Props = {
  priority?: boolean
  product: Partial<Product>
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

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-primary-foreground p-8">
        {Boolean(discountPercent) && (
          <span className="absolute left-2 top-2 z-10 rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground">
            -{discountPercent}%
          </span>
        )}
        {image ? (
          <Media
            className="relative h-full w-full"
            fill
            imgClassName={clsx('h-full w-full object-cover rounded-2xl', {
              'transition duration-300 ease-in-out group-hover:scale-102': true,
            })}
            priority={priority}
            resource={image}
          />
        ) : null}
      </div>

      <div className="font-mono text-primary/50 group-hover:text-primary flex justify-between items-center mt-4">
        <div>{title}</div>

        {typeof price === 'number' ? (
          <Price amount={price} />
        ) : (
          <div className="text-sm">Liên hệ</div>
        )}
      </div>
    </Link>
  )
}
