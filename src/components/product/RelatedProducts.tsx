import type { Product } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProductGridItem } from '@/components/ProductGridItem'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

type Props = {
  product: Product
}

export const RelatedProducts: React.FC<Props> = async ({ product }) => {
  const manualRelated =
    product.relatedProducts?.filter(
      (relatedProduct): relatedProduct is Product => typeof relatedProduct === 'object',
    ) ?? []

  let products = manualRelated

  if (!products.length) {
    const categoryIds = (product.categories ?? [])
      .map((category) => (typeof category === 'object' ? category.id : category))
      .filter(Boolean)

    if (categoryIds.length) {
      const payload = await getPayload({ config: configPromise })

      const fallback = await payload.find({
        collection: 'products',
        depth: 1,
        draft: false,
        limit: 10,
        overrideAccess: false,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { id: { not_equals: product.id } },
            { categories: { in: categoryIds } },
          ],
        },
      })

      products = fallback.docs
    }
  }

  if (!products.length) return null

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Sản phẩm liên quan</h2>
      <Carousel className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {products.map((relatedProduct) => (
            <CarouselItem
              className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              key={relatedProduct.id}
            >
              <ProductGridItem product={relatedProduct} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {products.length > 5 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
    </div>
  )
}
