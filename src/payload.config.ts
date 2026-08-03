import { mongooseAdapter } from '@payloadcms/db-mongodb'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Services } from '@/collections/Services'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // Component `BeforeLogin` render ra một message mà bạn sẽ thấy khi đăng nhập vào admin panel.
      // Có thể xóa bất cứ lúc nào. Chỉ cần xóa dòng bên dưới và statement import `BeforeLogin` ở dòng 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      // Component `BeforeDashboard` render ra block 'welcome' mà bạn sẽ thấy sau khi đăng nhập vào admin panel.
      // Có thể xóa bất cứ lúc nào. Chỉ cần xóa dòng bên dưới và statement import `BeforeDashboard` ở dòng 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [Users, Pages, Services, Categories, Media],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages', 'services'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  //email: nodemailerAdapter(),
  endpoints: [],
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp giờ là một optional dependency -
  // nếu bạn muốn resize ảnh, crop, set focal point, v.v.
  // hãy chắc chắn đã cài đặt nó và truyền vào config.
  // sharp,
})
