import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

import type { Media as MediaType, Product } from '@/payload-types'
import { Media } from '@/components/Media'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RichText } from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { generateMeta } from '@/utilities/generateMeta'
import { getServerSideURL } from '@/utilities/getURL'
import { ChevronLeftIcon } from 'lucide-react'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const services = await payload.find({
    collection: 'services',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return services.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const service = await queryServiceBySlug({ slug })

  if (!service) return {}

  return generateMeta({ doc: service })
}

export default async function ServicePage({ params }: Args) {
  const { slug } = await params
  const service = await queryServiceBySlug({ slug })

  if (!service) return notFound()

  const { coverImage, description, layout, pricing, relatedProducts, serviceAreas, title } =
    service

  const areaServed = (serviceAreas || [])
    .map((item) => item.area)
    .filter((area): area is string => Boolean(area))

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    areaServed: areaServed.length ? areaServed : undefined,
    description: service.shortDescription,
    name: title,
    provider: {
      '@type': 'Organization',
      name: process.env.COMPANY_NAME || 'Company',
      url: getServerSideURL(),
    },
    ...(pricing?.pricingType !== 'quote' && pricing?.price
      ? {
          offers: {
            '@type': 'Offer',
            price: pricing.price,
            priceCurrency: 'VND',
          },
        }
      : {}),
  }

  return (
    <article className="pb-24">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        type="application/ld+json"
      />
      <div className="container pt-8">
        <Button asChild className="mb-4" variant="ghost">
          <Link href="/services">
            <ChevronLeftIcon />
            Tất cả dịch vụ
          </Link>
        </Button>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg lg:basis-1/2">
            {coverImage && typeof coverImage === 'object' && (
              <Media
                imgClassName="h-full w-full object-cover"
                resource={coverImage as MediaType}
              />
            )}
          </div>

          <div className="flex flex-col gap-4 lg:basis-1/2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{service.shortDescription}</p>
            <PriceBlock pricing={pricing} />
            {description && <RichText data={description} enableGutter={false} />}
          </div>
        </div>
      </div>

      {layout && layout.length > 0 ? <RenderBlocks blocks={layout} /> : null}

      {relatedProducts && relatedProducts.length > 0 && (
        <div className="container pt-8">
          <h2 className="mb-4 text-2xl font-bold">Sản phẩm liên quan</h2>
          <ul className="flex w-full gap-4 overflow-x-auto pt-1">
            {relatedProducts
              .filter((product): product is Product => typeof product === 'object')
              .map((product) => (
                <li
                  className="w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
                  key={product.id}
                >
                  <Link href={`/products/${product.slug}`}>{product.title}</Link>
                </li>
              ))}
          </ul>
        </div>
      )}
    </article>
  )
}

function PriceBlock({
  pricing,
}: {
  pricing?: { pricingType?: string | null; price?: number | null; unit?: string | null } | null
}) {
  if (!pricing || pricing.pricingType === 'quote' || !pricing.price) {
    return <span className="text-lg font-semibold">Liên hệ báo giá</span>
  }

  const prefix = pricing.pricingType === 'from' ? 'Từ ' : ''
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(pricing.price)

  return (
    <span className="text-lg font-semibold">
      {prefix}
      {formattedPrice}đ{pricing.unit ? ` ${pricing.unit}` : ''}
    </span>
  )
}

const queryServiceBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'services',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  return result.docs?.[0] || null
}
