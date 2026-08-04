import type { Block } from 'payload'

export const TrustBadges: Block = {
  slug: 'trustBadges',
  interfaceName: 'TrustBadgesBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Mục',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'truck',
          options: [
            { label: 'Xe giao hàng', value: 'truck' },
            { label: 'Bảo hành (khiên)', value: 'shield' },
            { label: 'Vị trí / phạm vi', value: 'mapPin' },
            { label: 'Đổi trả (mũi tên xoay)', value: 'refresh' },
          ],
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  labels: {
    plural: 'Dải trust badge',
    singular: 'Dải trust badge',
  },
}
