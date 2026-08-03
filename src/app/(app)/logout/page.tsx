import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { LogoutPage } from './LogoutPage'

export default async function Logout() {
  return (
    <div className="container max-w-lg my-16">
      <LogoutPage />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Bạn đã đăng xuất.',
  openGraph: mergeOpenGraph({
    title: 'Đăng xuất',
    url: '/logout',
  }),
  title: 'Đăng xuất',
}
