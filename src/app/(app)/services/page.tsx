import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import type { Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'

export const metadata: Metadata = {
  description: 'Dịch vụ lắp đặt, bảo trì và khảo sát hệ thống camera an ninh.',
  title: 'Dịch vụ',
}

export default async function ServicesPage() {
  const payload = await getPayload({ config: configPromise })

  const { docs: services } = await payload.find({
    collection: 'services',
    limit: 100,
    overrideAccess: false,
    pagination: false,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return (
    <div className="container pt-8 pb-24">
      <h1 className="mb-8 text-3xl font-bold">Dịch vụ</h1>

      {services.length === 0 ? (
        <p className="text-muted-foreground">Chưa có dịch vụ nào được đăng.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
              href={`/services/${service.slug}`}
              key={service.id}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {service.coverImage && typeof service.coverImage === 'object' && (
                  <Media
                    className="h-full w-full object-cover"
                    imgClassName="h-full w-full object-cover"
                    resource={service.coverImage as MediaType}
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="text-lg font-semibold group-hover:underline">{service.title}</h2>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {service.shortDescription}
                </p>
                <PriceLabel pricing={service.pricing} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function PriceLabel({
  pricing,
}: {
  pricing?: { pricingType?: string | null; price?: number | null; unit?: string | null } | null
}) {
  if (!pricing || pricing.pricingType === 'quote' || !pricing.price) {
    return <span className="mt-auto text-sm font-medium">Liên hệ báo giá</span>
  }

  const prefix = pricing.pricingType === 'from' ? 'Từ ' : ''
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(pricing.price)

  return (
    <span className="mt-auto text-sm font-medium">
      {prefix}
      {formattedPrice}đ{pricing.unit ? ` ${pricing.unit}` : ''}
    </span>
  )
}
