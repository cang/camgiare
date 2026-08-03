'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { sendOrderAccessEmail } from './sendOrderAccessEmail'

type FormData = {
  email: string
  orderID: string
}

type Props = {
  initialEmail?: string
}

export const FindOrderForm: React.FC<Props> = ({ initialEmail }) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>({
    defaultValues: {
      email: initialEmail || user?.email,
    },
  })

  const onSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await sendOrderAccessEmail({
        email: data.email,
        orderID: data.orderID,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setSubmitError(result.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.')
      }
    } catch {
      setSubmitError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  if (success) {
    return (
      <Fragment>
        <h1 className="text-xl mb-4">Kiểm tra email của bạn</h1>
        <div className="prose dark:prose-invert">
          <p>
            {`Nếu tồn tại đơn hàng khớp với email và mã đơn hàng đã cung cấp, chúng tôi đã gửi cho bạn một email chứa liên kết để xem chi tiết đơn hàng.`}
          </p>
        </div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <h1 className="text-xl mb-4">Tìm đơn hàng của tôi</h1>
      <div className="prose dark:prose-invert mb-8">
        <p>{`Vui lòng nhập email và mã đơn hàng bên dưới. Chúng tôi sẽ gửi cho bạn liên kết để xem đơn hàng.`}</p>
      </div>
      <form className="max-w-lg flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <Label htmlFor="email" className="mb-2">
            Địa chỉ email
          </Label>
          <Input
            id="email"
            {...register('email', { required: 'Email là bắt buộc.' })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="orderID" className="mb-2">
            Mã đơn hàng
          </Label>
          <Input
            id="orderID"
            {...register('orderID', {
              required: 'Mã đơn hàng là bắt buộc.',
            })}
            type="text"
          />
          {errors.orderID && <FormError message={errors.orderID.message} />}
        </FormItem>
        {submitError && <FormError message={submitError} />}
        <Button type="submit" className="self-start" variant="default" disabled={isSubmitting}>
          {isSubmitting ? 'Đang gửi...' : 'Tìm đơn hàng'}
        </Button>
      </form>
    </Fragment>
  )
}
