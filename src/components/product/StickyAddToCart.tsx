'use client'

import type { Product } from '@/payload-types'

import React, { useEffect, useState } from 'react'

import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'

type Props = {
  product: Product
  targetId: string
}

export const StickyAddToCart: React.FC<Props> = ({ product, targetId }) => {
  const [isBuyboxOutOfView, setIsBuyboxOutOfView] = useState(false)
  const [isFooterVisible, setIsFooterVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsBuyboxOutOfView(!entry.isIntersecting)
    })

    observer.observe(target)

    return () => observer.disconnect()
  }, [targetId])

  useEffect(() => {
    const footer = document.getElementById('site-footer')
    if (!footer) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsFooterVisible(entry.isIntersecting)
    })

    observer.observe(footer)

    return () => observer.disconnect()
  }, [])

  if (!isBuyboxOutOfView || isFooterVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex items-center justify-between gap-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.title}</p>
          <div className="font-mono text-sm text-primary/70">
            <Price amount={product.priceInVND ?? 0} />
          </div>
        </div>
        <AddToCart product={product} />
      </div>
    </div>
  )
}
