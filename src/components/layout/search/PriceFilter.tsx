'use client'

import { priceRanges } from '@/lib/constants'
import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

export function PriceFilter() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('priceRange')

  return (
    <div>
      <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Mức giá</h3>
      <ul className="flex flex-col gap-2">
        {priceRanges.map((range) => {
          const isActive = active === range.key
          const params = new URLSearchParams(searchParams.toString())

          if (isActive) {
            params.delete('priceRange')
          } else {
            params.set('priceRange', range.key)
          }

          return (
            <li key={range.key}>
              <Link
                className={clsx('text-sm hover:underline', {
                  'font-semibold text-primary underline': isActive,
                })}
                href={createUrl(pathname, params)}
              >
                {range.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
