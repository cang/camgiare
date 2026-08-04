import { BrandFilter } from '@/components/layout/search/BrandFilter'
import { Categories } from '@/components/layout/search/Categories'
import { FilterList } from '@/components/layout/search/filter'
import { PriceFilter } from '@/components/layout/search/PriceFilter'
import { sorting } from '@/lib/constants'
import React, { Suspense } from 'react'

// Không lặp lại ô tìm kiếm ở đây — SearchBar trong Header (và trong MobileMenu ở mobile)
// đã đủ, thêm ô nữa sẽ tạo 2 ô tìm kiếm cùng lúc trên trang này.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4 ">
        <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
          <div className="w-full flex-none flex flex-col gap-4 md:gap-8 basis-1/5">
            <Categories />
            <BrandFilter />
            <PriceFilter />
            <FilterList list={sorting} title="Sắp xếp theo" />
          </div>
          <div className="min-h-screen w-full">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
