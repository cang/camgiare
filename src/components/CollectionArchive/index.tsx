import { cn } from '@/utilities/cn'
import React from 'react'

import type { Product } from '@/payload-types'

import { ProductGridItem } from '@/components/ProductGridItem'

export type Props = {
  posts: Product[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              return (
                <div className="col-span-4" key={index}>
                  <ProductGridItem product={result} />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
