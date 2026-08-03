import type { Metadata } from 'next'

import type { Page, Product, Service } from '../payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

export const generateMeta = async (args: { doc: Page | Product | Service }): Promise<Metadata> => {
  const { doc } = args || {}

  const ogImage =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    `${getServerSideURL()}${doc.meta.image.url}`

  const fallbackTitle = process.env.SITE_NAME || 'Website'
  const title = doc?.meta?.title || doc?.title || fallbackTitle

  // Chỉ noindex khi doc là bản draft đang xem qua preview — request công khai luôn chỉ trả về
  // document đã published nên _status ở đây gần như luôn là 'published'.
  const canIndex = doc && '_status' in doc ? doc._status === 'published' : true

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      ...(doc?.meta?.description
        ? {
            description: doc?.meta?.description,
          }
        : {}),
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    robots: {
      follow: canIndex,
      googleBot: {
        follow: canIndex,
        index: canIndex,
      },
      index: canIndex,
    },
    title,
  }
}
