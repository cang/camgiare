'use client'

import type { Brand } from '@/payload-types'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'

type Props = {
  brand: Brand
}

export const BrandCheckbox: React.FC<Props> = ({ brand }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selected = useMemo(
    () => searchParams.get('brand')?.split(',').filter(Boolean) ?? [],
    [searchParams],
  )
  const isChecked = Boolean(brand.slug) && selected.includes(brand.slug!)

  const toggle = useCallback(() => {
    if (!brand.slug) return
    const params = new URLSearchParams(searchParams.toString())
    const next = isChecked
      ? selected.filter((slug) => slug !== brand.slug)
      : [...selected, brand.slug]

    if (next.length > 0) {
      params.set('brand', next.join(','))
    } else {
      params.delete('brand')
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [brand.slug, isChecked, pathname, router, searchParams, selected])

  return (
    <label className="flex items-center gap-2 text-sm hover:cursor-pointer">
      <input checked={isChecked} className="accent-primary" onChange={toggle} type="checkbox" />
      {brand.name}
    </label>
  )
}
