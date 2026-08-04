import type { ProductHeroBlock as ProductHeroBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import React from 'react'

export const ProductHeroBlock: React.FC<
  ProductHeroBlockProps & {
    id?: string | number
  }
> = ({ eyebrow, heading, links, media, priceTagText, subheading }) => {
  return (
    <div className="container">
      <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
        <div className="flex-1">
          {eyebrow && (
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {heading}
          </h1>
          {subheading && <p className="mt-4 max-w-md text-muted-foreground">{subheading}</p>}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-3">
              {links.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink {...link} size="lg" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative w-full flex-1">
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-primary-foreground p-8">
            {media && typeof media === 'object' && (
              <Media
                className="relative h-full w-full"
                fill
                imgClassName="h-full w-full object-contain"
                priority
                resource={media}
              />
            )}
          </div>
          {priceTagText && (
            <span className="absolute bottom-4 left-4 rounded-full border bg-background px-4 py-2 font-mono text-sm font-semibold shadow-sm">
              {priceTagText}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
