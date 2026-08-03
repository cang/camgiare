import React from 'react'

export default function Loading() {
  return (
    <div className="container pt-8 pb-8">
      <div className="mb-4 h-9 w-40 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />

      <div className="flex flex-col gap-12 rounded-lg border p-8 md:py-12 lg:flex-row lg:gap-8 bg-primary-foreground">
        <div className="aspect-square h-full w-full basis-full animate-pulse rounded-lg bg-neutral-100 lg:basis-1/2 dark:bg-neutral-900" />

        <div className="flex basis-full flex-col gap-4 lg:basis-1/2">
          <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-11 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      </div>
    </div>
  )
}
