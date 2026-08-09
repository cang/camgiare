import { PhoneIcon } from 'lucide-react'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'

const ZaloIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#0068FF" height="48" rx="10" width="48" />
    <text
      fill="#fff"
      fontFamily="Arial, sans-serif"
      fontSize="17"
      fontWeight="700"
      textAnchor="middle"
      x="24"
      y="30"
    >
      Zalo
    </text>
  </svg>
)

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#1877F2" height="48" rx="10" width="48" />
    <path
      d="M27 16h3v-4h-3c-2.76 0-5 2.24-5 5v2h-3v4h3v9h4v-9h3.2l.8-4H26v-2c0-.55.45-1 1-1z"
      fill="#fff"
    />
  </svg>
)

export const FloatingContact: React.FC = async () => {
  const storeInfo = await getCachedGlobal('store-info', 0)()

  const items = [
    storeInfo.hotline && {
      key: 'phone',
      href: `tel:${storeInfo.hotline}`,
      label: `Gọi ${storeInfo.hotline}`,
      icon: (
        <span className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-green-500 text-white shadow-lg">
          <PhoneIcon className="h-6 w-6" />
        </span>
      ),
    },
    storeInfo.zaloLink && {
      key: 'zalo',
      href: storeInfo.zaloLink,
      label: 'Chat Zalo',
      icon: <ZaloIcon className="h-12 w-12 shadow-lg" />,
    },
    storeInfo.facebookLink && {
      key: 'facebook',
      href: storeInfo.facebookLink,
      label: 'Fanpage Facebook',
      icon: <FacebookIcon className="h-12 w-12 shadow-lg" />,
    },
  ].filter(Boolean) as { key: string; href: string; label: string; icon: React.ReactNode }[]

  if (!items.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {items.map((item) => (
        <a
          aria-label={item.label}
          href={item.href}
          key={item.key}
          rel="noopener noreferrer"
          target={item.key === 'phone' ? undefined : '_blank'}
          title={item.label}
        >
          {item.icon}
        </a>
      ))}
    </div>
  )
}
