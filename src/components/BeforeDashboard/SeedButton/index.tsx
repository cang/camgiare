'use client'

import React, { Fragment, useCallback, useState, MouseEvent } from 'react'
import { toast } from '@payloadcms/ui'

import './index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Đã tạo dữ liệu mẫu cho cơ sở dữ liệu! Bây giờ bạn có thể{' '}
    <a target="_blank" href="/">
      truy cập website của bạn
    </a>
  </div>
)

export const SeedButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (seeded) {
        toast.info('Cơ sở dữ liệu đã được tạo dữ liệu mẫu.')
        return
      }
      if (loading) {
        toast.info('Đang trong quá trình tạo dữ liệu mẫu.')
        return
      }
      if (error) {
        toast.error(`Đã xảy ra lỗi, vui lòng làm mới trang và thử lại.`)
        return
      }

      setLoading(true)

      try {
        toast.promise(
          new Promise((resolve, reject) => {
            try {
              fetch('/next/seed', { method: 'POST', credentials: 'include' })
                .then((res) => {
                  if (res.ok) {
                    resolve(true)
                    setSeeded(true)
                  } else {
                    reject('An error occurred while seeding.')
                  }
                })
                .catch((error) => {
                  reject(error)
                })
            } catch (error) {
              reject(error)
            }
          }),
          {
            loading: 'Đang tạo dữ liệu mẫu....',
            success: <SuccessMessage />,
            error: 'Đã xảy ra lỗi khi tạo dữ liệu mẫu.',
          },
        )
      } catch (err) {
        setError(err)
      }
    },
    [loading, seeded, error],
  )

  let message = ''
  if (loading) message = ' (đang tạo dữ liệu mẫu...)'
  if (seeded) message = ' (hoàn tất!)'
  if (error) message = ` (lỗi: ${error})`

  return (
    <Fragment>
      <button className="seedButton" onClick={handleClick}>
        Tạo dữ liệu mẫu cho cơ sở dữ liệu
      </button>
      {message}
    </Fragment>
  )
}
