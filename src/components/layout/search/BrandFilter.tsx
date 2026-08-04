import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

import { BrandCheckbox } from './BrandFilter.client'

async function BrandList() {
  const payload = await getPayload({ config: configPromise })
  const brands = await payload.find({ collection: 'brands', limit: 50, sort: 'name' })

  if (!brands.docs.length) return null

  return (
    <div>
      <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Thương hiệu</h3>
      <ul className="flex flex-col gap-2">
        {brands.docs.map((brand) => (
          <li key={brand.id}>
            <BrandCheckbox brand={brand} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BrandFilter() {
  return (
    <Suspense fallback={null}>
      <BrandList />
    </Suspense>
  )
}
