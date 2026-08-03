import { Grid } from '@/components/Grid'
import React from 'react'

export default function Loading() {
  return (
    <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(12)
        .fill(0)
        .map((_, index) => {
          return (
            <div key={index}>
              <div className="aspect-square animate-pulse rounded-2xl border bg-neutral-100 dark:bg-neutral-900" />
              <div className="mt-4 flex items-center justify-between">
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
                <div className="h-4 w-1/5 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
              </div>
            </div>
          )
        })}
    </Grid>
  )
}
