import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const StoreInfo: GlobalConfig = {
  slug: 'store-info',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  hooks: {
    afterChange: [revalidateGlobal('store-info')],
  },
  fields: [
    {
      name: 'hotline',
      type: 'text',
      label: 'Hotline tư vấn',
    },
    {
      name: 'zaloLink',
      type: 'text',
      label: 'Link Zalo',
      admin: {
        description: 'Link chat Zalo, vd: https://zalo.me/0919547338. Để trống thì nút Zalo nổi sẽ ẩn.',
      },
    },
    {
      name: 'facebookLink',
      type: 'text',
      label: 'Link Fanpage Facebook',
      admin: {
        description: 'Link Fanpage, vd: https://facebook.com/tenshop. Để trống thì nút Facebook nổi sẽ ẩn.',
      },
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
