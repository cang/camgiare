'use client'

import type { Product } from '@/payload-types'

import React, { useEffect, useState } from 'react'

import { ProductGridItem } from '@/components/ProductGridItem'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const STORAGE_KEY = 'recentlyViewedProducts'
const MAX_ITEMS = 12

type Props = {
  currentProductSlug: string
}

export const RecentlyViewed: React.FC<Props> = ({ currentProductSlug }) => {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let storedSlugs: string[] = []
    try {
      storedSlugs = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      storedSlugs = []
    }

    const otherSlugs = storedSlugs.filter((slug) => slug !== currentProductSlug)

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([currentProductSlug, ...otherSlugs].slice(0, MAX_ITEMS)),
    )

    if (!otherSlugs.length) {
      setProducts([])
      return
    }

    const where = {
      and: [{ _status: { equals: 'published' } }, { slug: { in: otherSlugs } }],
    }
    const params = new URLSearchParams()
    params.set('where', JSON.stringify(where))
    params.set('depth', '1')
    params.set('limit', String(otherSlugs.length))

    fetch(`/api/products?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { docs: [] }))
      .then((data) => {
        const bySlug = new Map<string, Product>(
          ((data.docs ?? []) as Product[]).map((product) => [product.slug ?? '', product]),
        )
        const ordered = otherSlugs
          .map((slug) => bySlug.get(slug))
          .filter((product): product is Product => Boolean(product))
        setProducts(ordered)
      })
      .catch(() => setProducts([]))
  }, [currentProductSlug])

  if (!products.length) return null

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Sản phẩm bạn đã xem</h2>
      <Carousel className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem
              className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              key={product.id}
            >
              <ProductGridItem product={product} />
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
