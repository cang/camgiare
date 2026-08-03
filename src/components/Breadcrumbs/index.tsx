import Link from 'next/link'
import React from 'react'
import { ChevronRightIcon } from 'lucide-react'

import { getServerSideURL } from '@/utilities/getURL'

export type BreadcrumbItem = {
  label: string
  href?: string
}

type Props = {
  items: BreadcrumbItem[]
}

export const Breadcrumbs: React.FC<Props> = ({ items }) => {
  const baseUrl = getServerSideURL()

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${baseUrl}${item.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
        type="application/ld+json"
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-primary/60">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li className="flex items-center gap-1" key={`${item.label}-${index}`}>
                {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5" />}
                {item.href && !isLast ? (
                  <Link className="hover:text-primary hover:underline" href={item.href}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-primary' : ''}>
                    {item.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
