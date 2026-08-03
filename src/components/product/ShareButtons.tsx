'use client'

import { FacebookIcon, LinkIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

type Props = {
  title: string
}

export const ShareButtons: React.FC<Props> = ({ title }) => {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    toast.success('Đã sao chép liên kết sản phẩm.')
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild size="icon" variant="ghost" aria-label="Chia sẻ lên Facebook">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FacebookIcon className="h-4 w-4" />
        </a>
      </Button>
      <Button asChild size="icon" variant="ghost" aria-label="Chia sẻ qua Zalo">
        <a
          href={`https://zalo.me/share?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="text-xs font-bold">Zalo</span>
        </a>
      </Button>
      <Button onClick={copyLink} size="icon" variant="ghost" aria-label="Sao chép liên kết">
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
