/* FILE NÀY ĐƯỢC TẠO TỰ ĐỘNG BỞI PAYLOAD. */
/* KHÔNG CHỈNH SỬA VÌ CÓ THỂ BỊ GHI ĐÈ BẤT CỨ LÚC NÀO. */
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

export const POST = GRAPHQL_POST(config)

export const OPTIONS = REST_OPTIONS(config)
