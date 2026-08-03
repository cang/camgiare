'use client'
import type { Product, Variant } from '@/payload-types'

import Link from 'next/link'
import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import React, { Suspense } from 'react'

import { VariantSelector } from './VariantSelector'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { StockIndicator } from '@/components/product/StockIndicator'
import { ShareButtons } from '@/components/product/ShareButtons'

export function ProductDescription({
  product,
  children,
}: {
  product: Product
  children?: React.ReactNode
}) {
  const { currency } = useCurrency()
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  if (hasVariants) {
    const priceField = `priceIn${currency.code}` as keyof Variant
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant) => variant && typeof variant === 'object')
      .sort((a, b) => {
        if (
          typeof a === 'object' &&
          typeof b === 'object' &&
          priceField in a &&
          priceField in b &&
          typeof a[priceField] === 'number' &&
          typeof b[priceField] === 'number'
        ) {
          return a[priceField] - b[priceField]
        }

        return 0
      }) as Variant[]

    const lowestVariant = variantsOrderedByPrice[0][priceField]
    const highestVariant = variantsOrderedByPrice[variantsOrderedByPrice.length - 1][priceField]
    if (
      variantsOrderedByPrice &&
      typeof lowestVariant === 'number' &&
      typeof highestVariant === 'number'
    ) {
      lowestAmount = lowestVariant
      highestAmount = highestVariant
    }
  } else if (product[priceField] && typeof product[priceField] === 'number') {
    amount = product[priceField]
  }

  const basePrice = product.priceInVND ?? 0
  const compareAtPrice =
    !hasVariants && typeof product.compareAtPriceInVND === 'number'
      ? product.compareAtPriceInVND
      : undefined
  const hasDiscount = compareAtPrice !== undefined && compareAtPrice > basePrice
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
    : 0

  const brand = typeof product.brand === 'object' ? product.brand : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {brand && (
          <Link
            className="flex items-center gap-2 text-sm text-primary/60 hover:text-primary"
            href={`/shop?brand=${brand.slug}`}
          >
            {brand.logo && typeof brand.logo === 'object' && (
              <Media
                className="relative h-5 w-8"
                imgClassName="h-full w-full object-contain"
                resource={brand.logo}
              />
            )}
            <span>{brand.name}</span>
          </Link>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-medium">{product.title}</h1>
        </div>
        {product.sku && <p className="text-sm text-primary/50">Mã SP: {product.sku}</p>}
      </div>

      <div className="flex items-center gap-3">
        {hasVariants ? (
          <Price className="uppercase font-mono" highestAmount={highestAmount} lowestAmount={lowestAmount} />
        ) : typeof product.priceInVND === 'number' ? (
          <Price className="uppercase font-mono" amount={amount} />
        ) : (
          <p className="uppercase font-mono">Liên hệ</p>
        )}
        {hasDiscount && (
          <>
            <span className="font-mono text-primary/40 line-through">
              <Price amount={compareAtPrice} />
            </span>
            <span className="rounded bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
              -{discountPercent}%
            </span>
          </>
        )}
      </div>

      {Boolean(product.shortDescription?.length) && (
        <ul className="list-disc space-y-1 pl-4 text-sm text-primary/80">
          {product.shortDescription!.map((item, index) => (
            <li key={index}>{item.text}</li>
          ))}
        </ul>
      )}

      {product.description ? (
        <RichText className="" data={product.description} enableGutter={false} />
      ) : null}

      <hr />
      {hasVariants && (
        <>
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>

          <hr />
        </>
      )}
      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Suspense fallback={null}>
          <AddToCart product={product} />
        </Suspense>
        <ShareButtons title={product.title} />
      </div>

      {children}
    </div>
  )
}
