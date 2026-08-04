import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

export async function CategoryStrip() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({ collection: 'categories', limit: 12, sort: 'title' })

  if (!categories.docs.length) return null

  return (
    <div className="bg-primary text-primary-foreground">
      <nav className="container flex items-center gap-6 overflow-x-auto py-2.5 text-sm">
        {categories.docs.map((category) => (
          <Link className="whitespace-nowrap opacity-90 hover:opacity-100" href={`/shop?category=${category.slug}`} key={category.id}>
            {category.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
