'use client'

import { Star } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'

type FormData = {
  authorName: string
  authorEmail: string
  comment: string
}

type Props = {
  productId: number | string
}

export const ReviewForm: React.FC<Props> = ({ productId }) => {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingError, setRatingError] = useState<string | null>(null)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      authorName: user?.name ?? '',
      authorEmail: user?.email ?? '',
    },
  })

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!rating) {
        setRatingError('Vui lòng chọn số sao đánh giá.')
        return
      }
      setRatingError(null)

      try {
        const res = await fetch('/api/reviews', {
          body: JSON.stringify({
            authorEmail: data.authorEmail,
            authorName: data.authorName,
            comment: data.comment,
            product: productId,
            rating,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        if (!res.ok) throw new Error('Gửi đánh giá thất bại')

        toast.success('Cảm ơn bạn đã đánh giá! Đánh giá sẽ hiển thị sau khi được duyệt.')
        reset()
        setRating(0)
      } catch (_) {
        toast.error('Gửi đánh giá thất bại. Vui lòng thử lại.')
      }
    },
    [productId, rating, reset],
  )

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormItem>
        <Label>Đánh giá của bạn</Label>
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              aria-label={`${star} sao`}
              className="p-0.5"
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              type="button"
            >
              <Star
                className={cn(
                  'size-6 transition-colors',
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-primary/20',
                )}
              />
            </button>
          ))}
        </div>
        {ratingError && <FormError message={ratingError} />}
      </FormItem>

      <FormItem>
        <Label htmlFor="authorName">Tên</Label>
        <Input id="authorName" {...register('authorName', { required: 'Vui lòng nhập tên.' })} />
        {errors.authorName && <FormError message={errors.authorName.message} />}
      </FormItem>

      <FormItem>
        <Label htmlFor="authorEmail">Email</Label>
        <Input
          id="authorEmail"
          type="email"
          {...register('authorEmail', { required: 'Vui lòng nhập email.' })}
        />
        {errors.authorEmail && <FormError message={errors.authorEmail.message} />}
      </FormItem>

      <FormItem>
        <Label htmlFor="comment">Nhận xét</Label>
        <Textarea
          id="comment"
          rows={4}
          {...register('comment', { required: 'Vui lòng nhập nội dung đánh giá.' })}
        />
        {errors.comment && <FormError message={errors.comment.message} />}
      </FormItem>

      <Button className="self-start" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
      </Button>
    </form>
  )
}
