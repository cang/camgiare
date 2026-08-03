import type { FieldHook } from 'payload'

import type { User } from '@/payload-types'

// đảm bảo user đầu tiên được tạo là admin
// 1. tìm một user duy nhất khi create một cách ngắn gọn nhất có thể
// 2. nếu không tìm thấy user nào, thêm `admin` vào mảng roles
// access control đã được xử lý bởi thuộc tính `access` của field này
// nó đảm bảo chỉ admin mới có thể create và update field `roles`
export const ensureFirstUserIsAdmin: FieldHook<User> = async ({ operation, req, value }) => {
  if (operation === 'create') {
    const users = await req.payload.find({ collection: 'users', depth: 0, limit: 0 })
    if (users.totalDocs === 0) {
      // nếu `admin` chưa có trong mảng giá trị, thêm nó vào
      if (!(value || []).includes('admin')) {
        return [...(value || []), 'admin']
      }
    }
  }

  return value
}
