import { createLocalReq, getPayload } from 'payload'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkRole } from '@/access/utilities'

export const maxDuration = 300 // Hàm này có thể chạy tối đa 300 giây

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Xác thực bằng cách truyền request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Hành động bị cấm.', { status: 403 })
  }

  try {
    // Tạo một Payload request object để truyền vào Local API cho các giao dịch (transactions)
    // Tại thời điểm này bạn nên truyền vào user, locale, và bất kỳ context nào khác mà Local API cần
    const payloadReq = await createLocalReq({ user }, payload)

    await seed({ payload, req: payloadReq })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Lỗi khi seed dữ liệu.', { status: 500 })
  }
}
