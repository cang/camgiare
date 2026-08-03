import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'

export type PreviewSearchParams = {
  path: string
  previewSecret: string
}

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('Bạn không được phép xem trước trang này', { status: 403 })
  }

  if (!path) {
    return new Response('Thiếu tham số truy vấn (search params)', { status: 404 })
  }

  if (!path.startsWith('/')) {
    return new Response('Endpoint này chỉ có thể được dùng để xem trước các đường dẫn tương đối', {
      status: 500,
    })
  }

  let user

  try {
    user = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for live preview')
    return new Response('Bạn không được phép xem trước trang này', { status: 403 })
  }

  const draft = await draftMode()

  if (!user) {
    draft.disable()
    return new Response('Bạn không được phép xem trước trang này', { status: 403 })
  }

  // Bạn có thể thêm các kiểm tra bổ sung tại đây để xác định người dùng có được phép xem trước trang này hay không

  draft.enable()

  redirect(path)
}
