import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { publicAccess } from '@/access/publicAccess'
import { checkRole } from '@/access/utilities'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    create: publicAccess,
    delete: adminOnly,
    read: ({ req: { user } }) => {
      if (user && checkRole(['admin'], user)) return true

      return {
        status: {
          equals: 'approved',
        },
      }
    },
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'authorName',
    group: 'Content',
    defaultColumns: ['product', 'rating', 'authorName', 'status', 'createdAt'],
  },
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create') {
          data.customer = req.user?.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
    {
      name: 'rating',
      type: 'number',
      label: 'Số sao (1-5)',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'authorName',
      type: 'text',
      label: 'Tên người đánh giá',
      required: true,
    },
    {
      name: 'authorEmail',
      type: 'email',
      label: 'Email',
      required: true,
      admin: {
        description: 'Không hiển thị công khai.',
      },
    },
    {
      name: 'comment',
      type: 'textarea',
      label: 'Nội dung đánh giá',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Tự động gắn nếu người đánh giá đang đăng nhập.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Trạng thái duyệt',
      defaultValue: 'pending',
      options: [
        { label: 'Chờ duyệt', value: 'pending' },
        { label: 'Đã duyệt', value: 'approved' },
      ],
      admin: {
        position: 'sidebar',
      },
      access: {
        create: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
    },
  ],
}
