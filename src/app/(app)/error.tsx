'use client'

import { Button } from '@/components/ui/button'
import React from 'react'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-border bg-background p-8 md:p-12">
      <h2 className="text-xl font-bold">Rất tiếc!</h2>
      <p className="my-2 text-muted-foreground">
        Đã xảy ra sự cố với cửa hàng của chúng tôi. Đây có thể là lỗi tạm thời, vui lòng thử lại
        thao tác của bạn.
      </p>
      <Button className="mt-4 w-full" onClick={() => reset()} type="button">
        Thử lại
      </Button>
    </div>
  )
}
