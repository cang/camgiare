import React from 'react'

export default function Loading() {
  return (
    <div className="container pt-8 pb-24">
      <div className="mb-4 h-9 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-100 lg:basis-1/2 dark:bg-neutral-900" />

        <div className="flex flex-col gap-4 lg:basis-1/2">
          <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-6 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      </div>
    </div>
  )
}
