import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateGlobal('header')],
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      label: 'Hotline',
      admin: {
        description: 'Số hotline hiển thị trên thanh trên cùng của header. Để trống nếu chưa có.',
      },
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
  ],
}
