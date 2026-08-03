import type { Metadata } from 'next'

import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { createUrl } from '@/utilities/createUrl'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

const PAGE_SIZE = 24

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
  const { q: searchValue, sort, category, page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    page,
    limit: PAGE_SIZE,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInVND: true,
      compareAtPriceInVND: true,
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
                          sku: {
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
                      'categories.slug': {
                        equals: category,
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

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams()
    if (searchValue) params.set('q', String(searchValue))
    if (sort) params.set('sort', String(sort))
    if (category) params.set('category', String(category))
    if (targetPage > 1) params.set('page', String(targetPage))
    return createUrl('/shop', params)
  }

  return (
    <div>
      {searchValue ? (
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'Không tìm thấy sản phẩm nào khớp với '
            : `Tìm thấy ${products.totalDocs} ${resultsText} cho `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">Không tìm thấy sản phẩm nào. Vui lòng thử bộ lọc khác.</p>
      )}

      {products?.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.docs.map((product, index) => {
            return (
              <ProductGridItem key={product.id} priority={index === 0} product={product} />
            )
          })}
        </Grid>
      ) : null}

      {products.totalPages > 1 ? (
        <Pagination className="mt-8">
          <PaginationContent>
            {products.hasPrevPage ? (
              <PaginationItem>
                <PaginationPrevious href={buildPageUrl(page - 1)} />
              </PaginationItem>
            ) : null}
            {Array.from({ length: products.totalPages }).map((_, index) => {
              const targetPage = index + 1
              return (
                <PaginationItem key={targetPage}>
                  <PaginationLink href={buildPageUrl(targetPage)} isActive={targetPage === page}>
                    {targetPage}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            {products.hasNextPage ? (
              <PaginationItem>
                <PaginationNext href={buildPageUrl(page + 1)} />
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
