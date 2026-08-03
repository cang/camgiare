/* FILE NÀY ĐƯỢC TẠO TỰ ĐỘNG BỞI PAYLOAD. */
/* KHÔNG CHỈNH SỬA VÌ CÓ THỂ BỊ GHI ĐÈ BẤT CỨ LÚC NÀO. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

export const GET = GRAPHQL_PLAYGROUND_GET(config)
