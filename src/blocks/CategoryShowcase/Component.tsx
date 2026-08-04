import type { Category, CategoryShowcaseBlock as CategoryShowcaseBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

const CategoryTile: React.FC<{ category: Category }> = async ({ category }) => {
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: {
      categories: {
        in: [category.id],
      },
    },
  })

  const image = products.docs[0]?.gallery?.[0]?.image
  const cover = image && typeof image === 'object' ? image : undefined

  return (
    <Link
      className="flex flex-col items-center gap-3"
      href={`/shop?category=${category.slug}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-primary-foreground p-4">
        {cover && (
          <Media
            className="relative h-full w-full"
            fill
            imgClassName="h-full w-full object-contain"
            resource={cover}
          />
        )}
      </div>
      <span className="text-center text-sm font-semibold">{category.title}</span>
    </Link>
  )
}

export const CategoryShowcaseBlock: React.FC<
  CategoryShowcaseBlockProps & {
    id?: string | number
  }
> = ({ categories, heading }) => {
  const validCategories = (categories || []).filter(
    (category): category is Category => typeof category === 'object' && category !== null,
  )

  if (validCategories.length === 0) return null

  return (
    <div className="container">
      {heading && <h2 className="mb-6 text-xl font-bold">{heading}</h2>}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {validCategories.map((category) => (
          <CategoryTile category={category} key={category.id} />
        ))}
      </div>
    </div>
  )
}
