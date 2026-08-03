'use client'

import { Button } from '@/components/ui/button'
import type { Product } from '@/payload-types'

import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

export function VariantSelector({ product }: { product: Product }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variants = product.variants?.docs
  const variantTypes = product.variantTypes
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantTypes?.length)

  if (!hasVariants) {
    return null
  }

  return variantTypes?.map((type) => {
    if (!type || typeof type !== 'object') {
      return <></>
    }

    const options = type.options?.docs

    if (!options || !Array.isArray(options) || !options.length) {
      return <></>
    }

    return (
      <dl className="" key={type.id}>
        <dt className="mb-4 text-sm">{type.label}</dt>
        <dd className="flex flex-wrap gap-3">
          <React.Fragment>
            {options?.map((option) => {
              if (!option || typeof option !== 'object') {
                return <></>
              }

              const optionID = option.id
              const optionKeyLowerCase = type.name

              // Dựa trên các tham số hiện tại để xây dựng tham số cho option này, nhờ đó giữ được trạng thái của các tham số khác trong url.
              const optionSearchParams = new URLSearchParams(searchParams.toString())

              // Xóa image và variant ID khỏi search params này để có thể lặp qua nó một cách an toàn.
              optionSearchParams.delete('variant')
              optionSearchParams.delete('image')

              // Cập nhật tham số của option bằng option hiện tại để phản ánh url *sẽ* thay đổi như thế nào,
              // nếu option này được click.
              optionSearchParams.set(optionKeyLowerCase, String(optionID))

              const currentOptions = Array.from(optionSearchParams.values())

              let isAvailableForSale = true

              // Tìm variant khớp với các option đã chọn
              if (variants) {
                const matchingVariant = variants
                  .filter((variant) => typeof variant === 'object')
                  .find((variant) => {
                    if (!variant.options || !Array.isArray(variant.options)) return false

                    // Kiểm tra xem tất cả các option của variant có khớp với các option hiện tại trong URL không
                    return variant.options.every((variantOption) => {
                      if (typeof variantOption !== 'object')
                        return currentOptions.includes(String(variantOption))

                      return currentOptions.includes(String(variantOption.id))
                    })
                  })

                if (matchingVariant) {
                  // Nếu tìm thấy variant khớp, đặt variant ID vào search params.
                  optionSearchParams.set('variant', String(matchingVariant.id))

                  if (matchingVariant.inventory && matchingVariant.inventory > 0) {
                    isAvailableForSale = true
                  } else {
                    isAvailableForSale = false
                  }
                }
              }

              const optionUrl = createUrl(pathname, optionSearchParams)

              // Option này được coi là active nếu nó có trong url params.
              const isActive =
                Boolean(isAvailableForSale) &&
                searchParams.get(optionKeyLowerCase) === String(optionID)

              return (
                <Button
                  variant={'ghost'}
                  aria-disabled={!isAvailableForSale}
                  className={clsx('px-2', {
                    'bg-primary/5 text-primary': isActive,
                  })}
                  disabled={!isAvailableForSale}
                  key={option.id}
                  onClick={() => {
                    router.replace(`${optionUrl}`, {
                      scroll: false,
                    })
                  }}
                  title={`${option.label} ${!isAvailableForSale ? ' (Hết hàng)' : ''}`}
                >
                  {option.label}
                </Button>
              )
            })}
          </React.Fragment>
        </dd>
      </dl>
    )
  })
}
