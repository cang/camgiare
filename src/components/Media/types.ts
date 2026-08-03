import type { StaticImageData } from 'next/image'
import type { ElementType, Ref } from 'react'

import type { Media as MediaType } from '@/payload-types'

export interface Props {
  alt?: string
  className?: string
  fill?: boolean // chỉ dùng cho NextImage
  height?: number
  htmlElement?: ElementType | null
  imgClassName?: string
  onClick?: () => void
  onLoad?: () => void
  priority?: boolean // chỉ dùng cho NextImage
  ref?: Ref<HTMLImageElement | HTMLVideoElement | null>
  resource?: MediaType | string | number // dùng cho media của Payload
  size?: string // chỉ dùng cho NextImage
  src?: StaticImageData // dùng cho media tĩnh
  videoClassName?: string
  width?: number
}
