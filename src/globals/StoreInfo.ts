import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const StoreInfo: GlobalConfig = {
  slug: 'store-info',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'hotline',
      type: 'text',
      label: 'Hotline tư vấn',
    },
    {
      name: 'shippingNote',
      type: 'text',
      label: 'Chính sách giao hàng (ngắn)',
      defaultValue: 'Giao hàng miễn phí toàn quốc',
    },
    {
      name: 'warrantyNote',
      type: 'text',
      label: 'Chính sách bảo hành (ngắn)',
      defaultValue: 'Bảo hành chính hãng 24 tháng',
    },
    {
      name: 'returnNote',
      type: 'text',
      label: 'Chính sách đổi trả (ngắn)',
      defaultValue: 'Đổi trả trong 7 ngày nếu lỗi do NSX',
    },
  ],
}
