'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export function AccountLink() {
  const { user } = useAuth()

  return (
    <Button asChild variant="nav" size="clear" className="navLink relative items-end">
      <Link href={user ? '/account' : '/login'}>
        <User className="h-4 w-4" />
        <span>{user ? 'Tài khoản' : 'Đăng nhập'}</span>
      </Link>
    </Button>
  )
}
