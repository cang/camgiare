'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
}

export const ForgotPasswordForm: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(async (data: FormData) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/forgot-password`,
      {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    if (response.ok) {
      setSuccess(true)
      setError('')
    } else {
      setError(
        'Đã có lỗi xảy ra khi gửi email đặt lại mật khẩu cho bạn. Vui lòng thử lại.',
      )
    }
  }, [])

  return (
    <Fragment>
      {!success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Quên mật khẩu</h1>
          <div className="prose dark:prose-invert mb-8">
            <p>
              {`Vui lòng nhập email của bạn bên dưới. Bạn sẽ nhận được một email hướng dẫn
              cách đặt lại mật khẩu. Để quản lý toàn bộ người dùng, `}
              <Link href="/admin/collections/users">đăng nhập vào trang quản trị</Link>.
            </p>
          </div>
          <form className="max-w-lg" onSubmit={handleSubmit(onSubmit)}>
            <Message className="mb-8" error={error} />

            <FormItem className="mb-8">
              <Label htmlFor="email" className="mb-2">
                Địa chỉ email
              </Label>
              <Input
                id="email"
                {...register('email', { required: 'Vui lòng cung cấp email của bạn.' })}
                type="email"
              />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <Button type="submit" variant="default">
              Quên mật khẩu
            </Button>
          </form>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Yêu cầu đã được gửi</h1>
          <div className="prose dark:prose-invert">
            <p>Kiểm tra email của bạn để lấy liên kết cho phép bạn đặt lại mật khẩu một cách an toàn.</p>
          </div>
        </React.Fragment>
      )}
    </Fragment>
  )
}
