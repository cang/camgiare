'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
  passwordConfirm: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = response.statusText || 'Đã có lỗi xảy ra khi tạo tài khoản.'
        setError(message)
        return
      }

      const redirect = searchParams.get('redirect')

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login(data)
        clearTimeout(timer)
        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Tạo tài khoản thành công')}`)
      } catch (_) {
        clearTimeout(timer)
        setError('Thông tin đăng nhập không chính xác. Vui lòng thử lại.')
      }
    },
    [login, router, searchParams],
  )

  return (
    <form className="max-w-lg py-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="prose dark:prose-invert mb-6">
        <p>
          {`Đây là nơi khách hàng mới có thể đăng ký và tạo tài khoản mới. Để quản lý toàn bộ người dùng, `}
          <Link href="/admin/collections/users">đăng nhập vào trang quản trị</Link>.
        </p>
      </div>

      <Message error={error} />

      <div className="flex flex-col gap-8 mb-8">
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
          <Label htmlFor="password" className="mb-2">
            Mật khẩu mới
          </Label>
          <Input
            id="password"
            {...register('password', { required: 'Mật khẩu là bắt buộc.' })}
            type="password"
          />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="passwordConfirm" className="mb-2">
            Xác nhận mật khẩu
          </Label>
          <Input
            id="passwordConfirm"
            {...register('passwordConfirm', {
              required: 'Vui lòng xác nhận mật khẩu của bạn.',
              validate: (value) => value === password.current || 'Mật khẩu xác nhận không khớp',
            })}
            type="password"
          />
          {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
        </FormItem>
      </div>
      <Button disabled={loading} type="submit" variant="default">
        {loading ? 'Đang xử lý' : 'Tạo tài khoản'}
      </Button>

      <div className="prose dark:prose-invert mt-8">
        <p>
          {'Đã có tài khoản? '}
          <Link href={`/login${allParams}`}>Đăng nhập</Link>
        </p>
      </div>
    </form>
  )
}
