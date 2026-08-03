import type { Product } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { BundleProductsClient } from './BundleProducts.client'

type Props = {
  product: Product
}

export const BundleProducts: React.FC<Props> = async ({ product }) => {
  const categoryIds = (product.categories ?? [])
    .map((category) => (typeof category === 'object' ? category.id : category))
    .filter(Boolean)

  const payload = await getPayload({ config: configPromise })

  const accessoryCategories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 50,
    overrideAccess: false,
    pagination: false,
    where: {
      isAccessory: {
        equals: true,
      },
    },
  })

  const accessoryCategoryIds = accessoryCategories.docs
    .map((category) => category.id)
    .filter((id) => !categoryIds.includes(id))

  // Sản phẩm thuộc chính danh mục phụ kiện thì không cần gợi ý mua kèm phụ kiện khác.
  const productIsAccessory = accessoryCategories.docs.some((category) =>
    categoryIds.includes(category.id),
  )

  if (productIsAccessory || !accessoryCategoryIds.length) return null

  const suggestions = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: 4,
    overrideAccess: false,
    sort: '-createdAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { id: { not_equals: product.id } },
        { categories: { in: accessoryCategoryIds } },
      ],
    },
  })

  if (!suggestions.docs.length) return null

  return <BundleProductsClient mainProduct={product} suggestions={suggestions.docs} />
}
