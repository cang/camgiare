import { Suspense } from 'react'

import type { Props } from './Component'

import { RenderParamsComponent } from './Component'

// Việc dùng `useSearchParams` từ `next/navigation` khiến toàn bộ route bị chuyển về client-side rendering (mất tối ưu)
// Để khắc phục, ta bọc component trong một `Suspense` component
// Xem thêm tại https://nextjs.org/docs/messages/deopted-into-client-rendering

export const RenderParams: React.FC<Props> = (props) => {
  return (
    <Suspense fallback={null}>
      <RenderParamsComponent {...props} />
    </Suspense>
  )
}
