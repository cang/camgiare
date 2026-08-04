import type { MegaMenuColumn } from '@/utilities/getCategoryMegaMenu'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import React from 'react'

type Props = {
  columns: MegaMenuColumn[]
  isActive?: boolean
  link: { label?: string | null; url?: string | null }
}

export const ProductMegaMenu: React.FC<Props> = ({ columns, isActive, link }) => {
  const trigger = (
    <CMSLink
      appearance="nav"
      className={cn('relative navLink', { active: isActive })}
      size="clear"
      url={link.url}
      label={link.label}
    />
  )

  if (columns.length === 0) {
    return trigger
  }

  return (
    <div className="group relative">
      {trigger}

      <div className="invisible absolute left-1/2 top-full z-30 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
        <div className="flex gap-8 rounded-xl border bg-background p-6 shadow-lg">
          {columns.map((column) => (
            <div className="min-w-[160px]" key={column.slug ?? column.title}>
              {column.slug ? (
                <Link
                  className="text-sm font-semibold uppercase tracking-wide hover:text-primary"
                  href={`/shop?category=${column.slug}`}
                >
                  {column.title}
                </Link>
              ) : (
                <span className="text-sm font-semibold uppercase tracking-wide">{column.title}</span>
              )}
              {column.children.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {column.children.map((child) => (
                    <li key={child.slug ?? child.title}>
                      <Link
                        className="text-sm text-muted-foreground hover:text-primary"
                        href={`/shop?category=${child.slug}`}
                      >
                        {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
