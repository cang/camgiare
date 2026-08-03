'use client'

import type { Media as MediaType, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/tile'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  discountPercent?: number
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ discountPercent, gallery }) => {
  const searchParams = useSearchParams()
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()
  const [isZoomOpen, setIsZoomOpen] = React.useState(false)

  const goToIndex = React.useCallback(
    (index: number) => {
      const total = gallery.length
      const next = ((index % total) + total) % total
      setCurrent(next)
      api?.scrollTo(next)
    },
    [api, gallery.length],
  )

  useEffect(() => {
    if (gallery.length <= 1) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToIndex(current - 1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToIndex(current + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [current, gallery.length, goToIndex])

  useEffect(() => {
    const values = Array.from(searchParams.values())

    if (values && api) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false

        let variantID: DefaultDocumentIDType

        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption

        return Boolean(values.find((value) => value === String(variantID)))
      })
      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [searchParams, api, gallery])

  return (
    <div>
      <div className="relative mx-auto mb-6 w-full max-w-md overflow-hidden">
        {Boolean(discountPercent) && (
          <span className="absolute left-3 top-3 z-10 rounded bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
            -{discountPercent}%
          </span>
        )}
        <button
          className="block w-full cursor-zoom-in"
          onClick={() => setIsZoomOpen(true)}
          type="button"
        >
          <Media
            resource={gallery[current].image}
            className="w-full"
            imgClassName="w-full rounded-lg"
            priority
          />
        </button>
      </div>

      <Dialog onOpenChange={setIsZoomOpen} open={isZoomOpen}>
        <DialogContent className="max-w-3xl p-2 sm:max-w-2xl lg:max-w-3xl">
          <DialogTitle className="sr-only">Ảnh phóng to</DialogTitle>
          <Media resource={gallery[current].image} className="w-full" imgClassName="w-full rounded-lg" />
        </DialogContent>
      </Dialog>

      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {gallery.map((item, i) => {
            if (typeof item.image !== 'object') return null

            return (
              <CarouselItem
                className="basis-1/5"
                key={`${item.image.id}-${i}`}
                onClick={() => goToIndex(i)}
              >
                <GridTileImage active={i === current} media={item.image} />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
