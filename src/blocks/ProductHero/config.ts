import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

export const ProductHero: Block = {
  slug: 'productHero',
  interfaceName: 'ProductHeroBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Dòng nhỏ phía trên',
    },
    {
      name: 'heading',
      type: 'text',
      label: 'Tiêu đề',
      required: true,
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'Mô tả ngắn',
    },
    {
      name: 'media',
      type: 'upload',
      label: 'Ảnh sản phẩm',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'priceTagText',
      type: 'text',
      label: 'Nhãn giá trên ảnh',
      admin: {
        description: 'Ví dụ: "Chỉ từ ₫2.230.000". Để trống nếu không muốn hiện nhãn giá.',
      },
    },
    linkGroup({
      appearances: ['default', 'outline'],
      overrides: {
        maxRows: 2,
      },
    }),
  ],
  labels: {
    plural: 'Hero sản phẩm',
    singular: 'Hero sản phẩm',
  },
}
