import React from 'react'

export default function Loading() {
  return (
    <div className="container pt-8 pb-24">
      <div className="mb-8 h-9 w-40 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <div className="flex flex-col overflow-hidden rounded-lg border" key={index}>
              <div className="aspect-video w-full animate-pulse bg-neutral-100 dark:bg-neutral-900" />
              <div className="flex flex-col gap-2 p-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
