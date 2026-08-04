'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { Phone } from 'lucide-react'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { AccountLink } from './AccountLink'
import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { SearchBar } from '@/components/layout/search/SearchBar'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/cn'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()

  return (
    <div className="relative z-20 border-b">
      <div className="flex items-center justify-between gap-4 bg-foreground px-4 py-2 text-xs text-background md:px-0">
        <div className="container flex items-center justify-between">
          {header.phone ? (
            <a className="flex items-center gap-1.5 font-medium" href={`tel:${header.phone}`}>
              <Phone className="h-3.5 w-3.5" />
              Hotline lắp đặt: <span className="font-semibold">{header.phone}</span>
            </a>
          ) : (
            <span />
          )}
          <div className="hidden items-center gap-3 opacity-80 sm:flex">
            <span>Giao hàng nhanh 24h</span>
            <span aria-hidden className="opacity-40">
              |
            </span>
            <span>Bảo hành chính hãng</span>
            <span aria-hidden className="opacity-40">
              |
            </span>
            <span>Lắp đặt toàn quốc</span>
          </div>
        </div>
      </div>
      <nav className="flex items-center md:items-end justify-between container pt-2">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
        <div className="flex w-full items-end justify-between">
          <div className="flex w-full items-end gap-6 md:w-1/3">
            <Link className="flex w-full items-center justify-center pt-4 pb-4 md:w-auto" href="/">
              <Logo className="h-9 w-auto md:h-10" priority />
            </Link>
            {menu.length ? (
              <ul className="hidden gap-4 text-sm md:flex md:items-center">
                {menu.map((item) => (
                  <li key={item.id}>
                    <CMSLink
                      {...item.link}
                      size={'clear'}
                      className={cn('relative navLink', {
                        active:
                          item.link.url && item.link.url !== '/'
                            ? pathname.includes(item.link.url)
                            : false,
                      })}
                      appearance="nav"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="hidden md:mx-4 md:block md:max-w-md md:flex-1">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="flex items-end justify-end md:w-1/3 gap-4">
            <div className="hidden md:block">
              <AccountLink />
            </div>
            <Suspense fallback={<OpenCartButton />}>
              <Cart />
            </Suspense>
          </div>
        </div>
      </nav>
    </div>
  )
}
