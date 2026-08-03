import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  return (
    <div className="container py-16">
      <ForgotPasswordForm />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Nhập địa chỉ email của bạn để khôi phục mật khẩu.',
  openGraph: mergeOpenGraph({
    title: 'Quên mật khẩu',
    url: '/forgot-password',
  }),
  title: 'Quên mật khẩu',
}
