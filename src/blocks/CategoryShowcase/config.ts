import type { Block } from 'payload'

export const CategoryShowcase: Block = {
  slug: 'categoryShowcase',
  interfaceName: 'CategoryShowcaseBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Danh mục sản phẩm',
      label: 'Tiêu đề',
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      label: 'Danh mục hiển thị',
      relationTo: 'categories',
      required: true,
    },
  ],
  labels: {
    plural: 'Lưới danh mục',
    singular: 'Lưới danh mục',
  },
}
