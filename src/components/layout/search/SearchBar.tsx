'use client'

import { SearchIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { Price } from '@/components/Price'
import { createUrl } from '@/utilities/createUrl'
import { cn } from '@/utilities/cn'

type Props = {
  className?: string
}

type Suggestion = {
  id: string
  priceInVND?: number
  slug: string
  title: string
}

export const SearchBar: React.FC<Props> = ({ className }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = value.trim()

    if (trimmed.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const controller = new AbortController()

    const timeout = setTimeout(async () => {
      try {
        const where = {
          and: [
            { _status: { equals: 'published' } },
            { or: [{ title: { like: trimmed } }, { sku: { like: trimmed } }] },
          ],
        }
        const params = new URLSearchParams()
        params.set('where', JSON.stringify(where))
        params.set('limit', '8')
        params.set('depth', '0')
        params.set('select[title]', 'true')
        params.set('select[slug]', 'true')
        params.set('select[priceInVND]', 'true')

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) return

        const data = await res.json()
        setSuggestions(data.docs ?? [])
        setIsOpen(true)
        setHighlightedIndex(-1)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setSuggestions([])
      }
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const goToProduct = (slug: string) => {
    setIsOpen(false)
    router.push(`/products/${slug}`)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      goToProduct(suggestions[highlightedIndex].slug)
      return
    }

    setIsOpen(false)
    const params = new URLSearchParams()
    const trimmed = value.trim()
    if (trimmed) params.set('q', trimmed)
    router.push(createUrl('/shop', params))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !suggestions.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <form className="flex w-full items-center gap-2" onSubmit={handleSubmit} role="search">
        <input
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Bạn cần tìm..."
          type="search"
          value={value}
        />
        <button
          aria-label="Tìm kiếm"
          className="flex shrink-0 items-center justify-center rounded-md border p-2 hover:bg-primary-foreground"
          type="submit"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </form>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-md border bg-background shadow-lg">
          {suggestions.map((item, index) => (
            <li key={item.id}>
              <button
                className={cn(
                  'flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-primary-foreground',
                  { 'bg-primary-foreground': index === highlightedIndex },
                )}
                onClick={() => goToProduct(item.slug)}
                onMouseEnter={() => setHighlightedIndex(index)}
                type="button"
              >
                <span className="truncate">{item.title}</span>
                {typeof item.priceInVND === 'number' && (
                  <Price amount={item.priceInVND} className="shrink-0 font-mono text-destructive" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
