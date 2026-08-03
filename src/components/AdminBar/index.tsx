'use client'

import type { PayloadAdminBarProps } from '@payloadcms/admin-bar'

import { cn } from '@/utilities/cn'
import { useSelectedLayoutSegments } from 'next/navigation'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useState } from 'react'
import { User } from '@/payload-types'

const collectionLabels = {
  pages: {
    plural: 'Trang',
    singular: 'Trang',
  },
  posts: {
    plural: 'Bài viết',
    singular: 'Bài viết',
  },
  projects: {
    plural: 'Dự án',
    singular: 'Dự án',
  },
}

const Title: React.FC = () => <span>Bảng điều khiển</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
  const { adminBarProps } = props || {}
  const segments = useSelectedLayoutSegments()
  const [show, setShow] = useState(false)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - cần sửa sau, chưa rõ tại sao chỗ này bị lỗi
  const collection = collectionLabels?.[segments?.[1]] ? segments?.[1] : 'pages'

  const onAuthChange = React.useCallback((user: User) => {
    const canSeeAdmin = user?.roles && Array.isArray(user?.roles) && user?.roles?.includes('admin')

    setShow(Boolean(canSeeAdmin))
  }, [])

  return (
    <div
      className={cn('py-2 bg-black text-white', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container">
        <PayloadAdminBar
          {...adminBarProps}
          className="py-2 text-white"
          classNames={{
            controls: 'font-medium text-white',
            logo: 'text-white',
            user: 'text-white',
          }}
          cmsURL={process.env.NEXT_PUBLIC_SERVER_URL}
          collectionLabels={{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - cần sửa sau, chưa rõ tại sao chỗ này bị lỗi
            plural: collectionLabels[collection]?.plural || 'Trang',
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - cần sửa sau, chưa rõ tại sao chỗ này bị lỗi
            singular: collectionLabels[collection]?.singular || 'Trang',
          }}
          logo={<Title />}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - cần sửa sau, chưa rõ tại sao chỗ này bị lỗi
          onAuthChange={onAuthChange}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            position: 'relative',
            zIndex: 'unset',
          }}
        />
      </div>
    </div>
  )
}
