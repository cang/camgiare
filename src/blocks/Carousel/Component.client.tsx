'use client'
import type { Media, Product } from '@/payload-types'

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import AutoScroll from 'embla-carousel-auto-scroll'
import Link from 'next/link'
import React from 'react'
import { GridTileImage } from '@/components/Grid/tile'

export const CarouselClient: React.FC<{ products: Product[] }> = async ({ products }) => {
  if (!products?.length) return null

  // Cố ý nhân đôi sản phẩm để carousel chạy lặp vòng và không bị hết sản phẩm trên màn hình rộng.
  const carouselProducts = [...products, ...products, ...products]

  return (
    <Carousel
      className="w-full"
      opts={{ align: 'start', loop: true }}
      plugins={[
        AutoScroll({
          playOnInit: true,
          speed: 1,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {carouselProducts.map((product, i) => {
          const image = product.gallery?.[0]?.image

          return (
            <CarouselItem
              className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
              key={`${product.slug}${i}`}
            >
              <Link className="relative h-full w-full" href={`/products/${product.slug}`}>
                <GridTileImage
                  label={{
                    amount: product.priceInVND!,
                    title: product.title,
                  }}
                  media={typeof image === 'object' ? (image as Media) : undefined}
                />
              </Link>
            </CarouselItem>
          )
        })}
      </CarouselContent>
    </Carousel>
  )
}
