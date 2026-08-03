import Image from 'next/image'
import React from 'react'

type Props = {
  className?: string
  priority?: boolean
}

export const Logo: React.FC<Props> = ({ className, priority = false }) => {
  return (
    <Image
      alt="Phú Gia Cát"
      className={className || 'h-10 w-auto'}
      height={400}
      priority={priority}
      src="/logo.png"
      width={623}
    />
  )
}
