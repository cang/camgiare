import type { Media } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BrandInfo } from '@/components/product/BrandInfo'
import { BundleProducts } from '@/components/product/BundleProducts'
import { Gallery } from '@/components/product/Gallery'
import { ProductDescription } from '@/components/product/ProductDescription'
import { RecentlyViewed } from '@/components/product/RecentlyViewed'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { Reviews } from '@/components/product/Reviews'
import { SpecsTable } from '@/components/product/SpecsTable'
import { StickyAddToCart } from '@/components/product/StickyAddToCart'
import { StoreInfoSidebar } from '@/components/product/StoreInfoSidebar'
import { generateMeta } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'
import { Metadata } from 'next'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return {}

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []
  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  // Chưa có ảnh SEO riêng thì dùng tạm ảnh đầu tiên trong gallery sản phẩm.
  const seoImage = metaImage || (gallery.length ? (gallery[0]?.image as Media) : undefined)

  return generateMeta({
    doc: {
      ...product,
      meta: {
        ...product.meta,
        image: seoImage,
      },
    },
  })
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const hasStock = product.enableVariants
    ? product?.variants?.docs?.some((variant) => {
        if (typeof variant !== 'object') return false
        return variant.inventory && variant?.inventory > 0
      })
    : product.inventory! > 0

  let price = product.priceInVND

  if (product.enableVariants && product?.variants?.docs?.length) {
    price = product?.variants?.docs?.reduce((acc, variant) => {
      if (typeof variant === 'object' && variant?.priceInVND && acc && variant?.priceInVND > acc) {
        return variant.priceInVND
      }
      return acc
    }, price)
  }

  const compareAtPrice =
    !product.enableVariants && typeof product.compareAtPriceInVND === 'number'
      ? product.compareAtPriceInVND
      : undefined
  const discountPercent =
    compareAtPrice && product.priceInVND && compareAtPrice > product.priceInVND
      ? Math.round(((compareAtPrice - product.priceInVND) / compareAtPrice) * 100)
      : undefined

  const brand = typeof product.brand === 'object' ? product.brand : undefined
  const firstCategory = product.categories?.find(
    (category): category is NonNullable<typeof category> & { title: string; slug?: string | null } =>
      typeof category === 'object',
  )

  const productJsonLd = {
    name: product.title,
    '@context': 'https://schema.org',
    '@type': 'Product',
    description: product.description,
    image: metaImage?.url,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(brand ? { brand: { '@type': 'Brand', name: brand.name } } : {}),
    offers: {
      '@type': product.enableVariants ? 'AggregateOffer' : 'Offer',
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price: price,
      priceCurrency: 'VND',
    },
  }

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop' },
    ...(firstCategory
      ? [{ label: firstCategory.title, href: `/shop?category=${firstCategory.slug}` }]
      : []),
    { label: product.title },
  ]

  return (
    <React.Fragment>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
        type="application/ld+json"
      />
      <div className="container pt-8 pb-8">
        <Breadcrumbs items={breadcrumbItems} />
        <div
          className="flex flex-col gap-12 rounded-lg border p-8 md:py-12 lg:flex-row lg:items-start lg:gap-8 bg-primary-foreground"
          id="product-buybox"
        >
          <div className="h-full w-full basis-full lg:basis-1/2">
            <Suspense
              fallback={
                <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden" />
              }
            >
              {Boolean(gallery?.length) && (
                <Gallery discountPercent={discountPercent} gallery={gallery} />
              )}
            </Suspense>
          </div>

          <div className="basis-full lg:basis-1/2">
            <ProductDescription product={product}>
              <StoreInfoSidebar />
            </ProductDescription>
          </div>
        </div>

        {(Boolean(product.specifications?.length) || brand) && (
          <div className="mt-8 flex flex-col gap-10">
            {Boolean(product.specifications?.length) && (
              <SpecsTable specifications={product.specifications!} />
            )}
            {brand && <BrandInfo brand={brand} />}
          </div>
        )}
      </div>

      <StickyAddToCart product={product} targetId="product-buybox" />

      <div className="container">
        <BundleProducts product={product} />
      </div>

      {product.layout?.length ? <RenderBlocks blocks={product.layout} /> : <></>}

      <div className="container">
        <RelatedProducts product={product} />
        <RecentlyViewed currentProductSlug={product.slug!} />
        <Reviews product={product} />
      </div>
    </React.Fragment>
  )
}

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
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
    populate: {
      variants: {
        title: true,
        priceInVND: true,
        inventory: true,
        options: true,
      },
    },
  })

  return result.docs?.[0] || null
}
