import type { Metadata } from 'next'

import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, sort, category } = await searchParams
  // Các biến thể lọc/sắp xếp/tìm kiếm đều canonical về /shop sạch, và không index riêng để
  // tránh trùng lặp nội dung với chính nó.
  const isFiltered = Boolean(q || sort || category)

  return {
    alternates: {
      canonical: '/shop',
    },
    description: 'Tìm kiếm sản phẩm trong cửa hàng.',
    robots: isFiltered
      ? {
          follow: true,
          index: false,
        }
      : undefined,
    title: 'Cửa hàng',
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInVND: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue || category
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          description: {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(category
                ? [
                    {
                      categories: {
                        contains: category,
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'kết quả' : 'kết quả'

  return (
    <div>
      {searchValue ? (
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'Không tìm thấy sản phẩm nào khớp với '
            : `Tìm thấy ${products.docs.length} ${resultsText} cho `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">Không tìm thấy sản phẩm nào. Vui lòng thử bộ lọc khác.</p>
      )}

      {products?.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.docs.map((product) => {
            return <ProductGridItem key={product.id} product={product} />
          })}
        </Grid>
      ) : null}
    </div>
  )
}
