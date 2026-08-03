import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import Link from 'next/link'
import React from 'react'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LoginForm } from '@/components/forms/LoginForm'
import { redirect } from 'next/navigation'

export default async function Login() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('Bạn đã đăng nhập rồi.')}`)
  }

  return (
    <div className="container">
      <div className="max-w-xl mx-auto my-12">
        <RenderParams />

        <h1 className="mb-4 text-[1.8rem]">Đăng nhập</h1>
        <p className="mb-8">
          {`Đây là nơi khách hàng của bạn đăng nhập để quản lý tài khoản, xem lại lịch sử đơn hàng và nhiều hơn nữa. Để quản lý tất cả người dùng, `}
          <Link href="/admin/collections/users">đăng nhập vào trang quản trị</Link>.
        </p>
        <LoginForm />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Đăng nhập hoặc tạo tài khoản để bắt đầu.',
  openGraph: {
    title: 'Đăng nhập',
    url: '/login',
  },
  title: 'Đăng nhập',
}
