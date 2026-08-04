import type { Product, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { DefaultDocumentIDType, getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'
import { RichText } from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  const limit = limitFromProps || 3

  let posts: Product[] = []

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const fetchedProducts = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit,
      overrideAccess: false,
      ...(flattenedCategories && flattenedCategories.length > 0
        ? {
            where: {
              categories: {
                in: flattenedCategories,
              },
            },
          }
        : {}),
    })

    posts = fetchedProducts.docs
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedPosts = selectedDocs.map((post) => {
        if (typeof post.value === 'object') return post.value
      }) as Product[]

      posts = filteredSelectedPosts
    }
  }

  // Chỉ 1 danh mục thì trỏ "Xem tất cả" tới đúng danh mục đó, còn lại (không lọc hoặc
  // lọc nhiều danh mục) thì trỏ về toàn bộ cửa hàng vì /shop chỉ nhận 1 category tại 1 lúc.
  const singleCategorySlug =
    categories?.length === 1 && typeof categories[0] === 'object' ? categories[0].slug : undefined
  const viewAllHref = singleCategorySlug ? `/shop?category=${singleCategorySlug}` : '/shop'

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16 flex flex-wrap items-baseline justify-between gap-4">
          <RichText className="ml-0 max-w-3xl" data={introContent} enableGutter={false} />
          {populateBy === 'collection' && (
            <Link className="shrink-0 text-sm font-semibold text-primary hover:underline" href={viewAllHref}>
              Xem tất cả →
            </Link>
          )}
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  )
}
