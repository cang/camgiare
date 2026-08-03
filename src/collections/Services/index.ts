import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { FormBlock } from '@/blocks/Form/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { adminOnly } from '@/access/adminOnly'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { revalidateService, revalidateServiceDelete } from './hooks/revalidateService'

export const serviceTypeOptions = [
  { label: 'Lắp đặt mới', value: 'installation' },
  { label: 'Bảo trì - Bảo dưỡng', value: 'maintenance' },
  { label: 'Khảo sát công trình', value: 'survey' },
  { label: 'Sửa chữa', value: 'repair' },
  { label: 'Tư vấn giải pháp', value: 'consulting' },
  { label: 'Khác', value: 'other' },
]

export const Services: CollectionConfig = {
  slug: 'services',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  admin: {
    group: 'Shop',
    defaultColumns: ['title', 'serviceType', 'pricing.pricingType', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'services',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'services',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      admin: {
        description: 'Hiển thị ở trang danh sách dịch vụ và dùng làm mô tả SEO mặc định.',
      },
      required: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
            },
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, FormBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'pricing',
              type: 'group',
              fields: [
                {
                  name: 'pricingType',
                  type: 'select',
                  defaultValue: 'quote',
                  options: [
                    { label: 'Giá cố định', value: 'fixed' },
                    { label: 'Giá từ', value: 'from' },
                    { label: 'Liên hệ báo giá', value: 'quote' },
                  ],
                  required: true,
                },
                {
                  name: 'price',
                  type: 'number',
                  admin: {
                    condition: (_, siblingData) => siblingData?.pricingType !== 'quote',
                    description: 'Đơn vị: VND',
                  },
                  min: 0,
                },
                {
                  name: 'unit',
                  type: 'text',
                  admin: {
                    condition: (_, siblingData) => siblingData?.pricingType !== 'quote',
                    description: 'Ví dụ: /camera, /m2, /lần khảo sát',
                  },
                },
              ],
            },
            {
              name: 'serviceType',
              type: 'select',
              options: serviceTypeOptions,
              required: true,
            },
            {
              name: 'serviceAreas',
              type: 'array',
              admin: {
                description: 'Khu vực phục vụ, ví dụ: TP.HCM, Hà Nội, Bình Dương',
              },
              fields: [
                {
                  name: 'area',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Service Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateService],
    afterDelete: [revalidateServiceDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}
