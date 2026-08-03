'use client'

import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import React, { Fragment, useEffect, useState } from 'react'

export const LogoutPage: React.FC = (props) => {
  const { logout } = useAuth()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        setSuccess('Đăng xuất thành công.')
      } catch (_) {
        setError('Bạn đã đăng xuất rồi.')
      }
    }

    void performLogout()
  }, [logout])

  return (
    <Fragment>
      {(error || success) && (
        <div className="prose dark:prose-invert">
          <h1>{error || success}</h1>
          <p>
            Bạn muốn làm gì tiếp theo?
            <Fragment>
              {' '}
              <Link href="/search">Nhấn vào đây</Link>
              {` để mua sắm.`}
            </Fragment>
            {` Để đăng nhập lại, `}
            <Link href="/login">nhấn vào đây</Link>.
          </p>
        </div>
      )}
    </Fragment>
  )
}
