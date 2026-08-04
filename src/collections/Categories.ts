import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        description:
          'Danh mục cha (để trống nếu đây là danh mục gốc). Dùng để tạo cây danh mục nhiều cấp và breadcrumb.',
      },
      filterOptions: ({ id }) => {
        if (!id) return true
        return { id: { not_equals: id } }
      },
      relationTo: 'categories',
    },
    {
      name: 'isAccessory',
      type: 'checkbox',
      label: 'Danh mục phụ kiện',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Đánh dấu nếu đây là danh mục phụ kiện (thẻ nhớ, nguồn, dây cáp...). Dùng để tự động gợi ý "Sản phẩm mua kèm" trên trang các sản phẩm không thuộc danh mục phụ kiện.',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
