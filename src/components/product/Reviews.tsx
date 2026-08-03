import type { Product } from '@/payload-types'

import { format } from 'date-fns'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ReviewForm } from '@/components/product/ReviewForm'
import { StarRating } from '@/components/product/StarRating'

type Props = {
  product: Product
}

export const Reviews: React.FC<Props> = async ({ product }) => {
  const payload = await getPayload({ config: configPromise })

  const { docs: reviews, totalDocs } = await payload.find({
    collection: 'reviews',
    depth: 0,
    limit: 50,
    overrideAccess: false,
    sort: '-createdAt',
    where: {
      and: [{ product: { equals: product.id } }, { status: { equals: 'approved' } }],
    },
  })

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <div className="py-8" id="reviews">
      <h2 className="mb-4 text-2xl font-bold">Đánh giá về sản phẩm</h2>

      {reviews.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <StarRating rating={averageRating} size="md" />
          <span className="font-mono text-sm text-primary/70">
            {averageRating.toFixed(1)}/5 · {totalDocs} đánh giá
          </span>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {reviews.length ? (
            reviews.map((review) => (
              <div className="border-b pb-6 last:border-b-0" key={review.id}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{review.authorName}</span>
                  <span className="text-xs text-primary/50">
                    {format(new Date(review.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
                <StarRating className="my-1" rating={review.rating} />
                <p className="text-sm text-primary/80">{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-primary/60">
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này.
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium">Viết đánh giá của bạn</h3>
          <ReviewForm productId={product.id} />
        </div>
      </div>
    </div>
  )
}
