import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

// Header/Footer được cache qua unstable_cache theo tag `global_<slug>` (xem getGlobals.ts),
// nhưng cache đó không tự invalidate khi admin lưu — thiếu hook này thì đổi nav item xong
// vẫn thấy nội dung cũ trên site cho tới khi dev server restart / build lại.
export const revalidateGlobal = (slug: string): GlobalAfterChangeHook => {
  return ({ doc }) => {
    revalidateTag(`global_${slug}`, 'max')
    return doc
  }
}
