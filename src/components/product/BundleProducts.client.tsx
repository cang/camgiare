'use client'

import type { Product } from '@/payload-types'

import Link from 'next/link'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

type Props = {
  mainProduct: Product
  suggestions: Product[]
}

export const BundleProductsClient: React.FC<Props> = ({ mainProduct, suggestions }) => {
  const { addItem, isLoading } = useCart()
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(
    () => new Set(suggestions.map((item) => item.id)),
  )

  const toggle = useCallback((id: number | string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const items = useMemo(
    () => [
      { ...mainProduct, locked: true },
      ...suggestions.map((product) => ({ ...product, locked: false })),
    ],
    [mainProduct, suggestions],
  )

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (!item.locked && !selectedIds.has(item.id)) return sum
        return sum + (item.priceInVND ?? 0)
      }, 0),
    [items, selectedIds],
  )

  const selectedCount = 1 + selectedIds.size

  const addAllToCart = useCallback(async () => {
    const idsToAdd = items
      .filter((item) => item.locked || selectedIds.has(item.id))
      .map((item) => item.id)

    for (const id of idsToAdd) {
      await addItem({ product: id })
    }

    toast.success(`Đã thêm ${idsToAdd.length} sản phẩm vào giỏ hàng.`)
  }, [addItem, items, selectedIds])

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Sản phẩm mua kèm</h2>

      <div className="flex flex-col gap-4 rounded-lg border p-6 bg-primary-foreground">
        {items.map((item) => {
          const image =
            item.gallery?.[0]?.image && typeof item.gallery[0].image === 'object'
              ? item.gallery[0].image
              : undefined

          return (
            <div className="flex items-center gap-4" key={item.id}>
              <Checkbox
                aria-label={`Chọn ${item.title}`}
                checked={item.locked || selectedIds.has(item.id)}
                disabled={item.locked}
                onCheckedChange={() => toggle(item.id)}
              />
              {image && (
                <Media
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-background"
                  imgClassName="h-full w-full object-contain"
                  resource={image}
                />
              )}
              <Link className="flex-1 text-sm hover:underline" href={`/products/${item.slug}`}>
                {item.title}
              </Link>
              {typeof item.priceInVND === 'number' ? (
                <Price amount={item.priceInVND} className="font-mono text-sm" />
              ) : (
                <span className="text-sm">Liên hệ</span>
              )}
            </div>
          )
        })}

        <div className="mt-2 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            Tổng cộng ({selectedCount} sản phẩm):{' '}
            <Price amount={total} as="span" className="font-mono font-semibold" />
          </div>
          <Button disabled={isLoading} onClick={addAllToCart}>
            Thêm tất cả vào giỏ
          </Button>
        </div>
      </div>
    </div>
  )
}
