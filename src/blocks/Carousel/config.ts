import type { Block } from 'payload'

export const Carousel: Block = {
  slug: 'carousel',
  fields: [
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      options: [
        {
          label: 'Bộ sưu tập',
          value: 'collection',
        },
        {
          label: 'Chọn thủ công',
          value: 'selection',
        },
      ],
    },
    {
      name: 'relationTo',
      type: 'select',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
      defaultValue: 'products',
      label: 'Bộ sưu tập cần hiển thị',
      options: [
        {
          label: 'Sản phẩm',
          value: 'products',
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
      hasMany: true,
      label: 'Danh mục cần hiển thị',
      relationTo: 'categories',
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
        step: 1,
      },
      defaultValue: 10,
      label: 'Giới hạn',
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
      },
      hasMany: true,
      label: 'Lựa chọn',
      relationTo: ['products'],
    },
    {
      name: 'populatedDocs',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
        description: 'Trường này được tự động điền sau khi đọc dữ liệu',
        disabled: true,
      },
      hasMany: true,
      label: 'Tài liệu đã điền',
      relationTo: ['products'],
    },
    {
      name: 'populatedDocsTotal',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
        description: 'Trường này được tự động điền sau khi đọc dữ liệu',
        disabled: true,
        step: 1,
      },
      label: 'Tổng số tài liệu đã điền',
    },
  ],
  interfaceName: 'CarouselBlock',
  labels: {
    plural: 'Danh sách băng chuyền',
    singular: 'Băng chuyền',
  },
}
