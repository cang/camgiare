import type { Metadata } from 'next'

const siteName = process.env.SITE_NAME || 'Website'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: process.env.SITE_DESCRIPTION || '',
  // TODO: thêm ảnh OG mặc định thật của thương hiệu (khuyến nghị 1200x630) khi có asset.
  images: undefined,
  siteName,
  title: siteName,
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
