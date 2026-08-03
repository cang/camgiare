'use client'
import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { defaultCountries as supportedCountries } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { titles } from './constants'
import { Button } from '@/components/ui/button'
import { deepMergeSimple } from 'payload/shared'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'

type AddressFormValues = {
  title?: string | null
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Omit<Address, 'country' | 'id' | 'updatedAt' | 'createdAt'> & { country?: string }
  callback?: (data: Partial<Address>) => void
  /**
   * Nếu true, form sẽ không gửi lên API.
   */
  skipSubmission?: boolean
}

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callback,
  skipSubmission,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AddressFormValues>({
    defaultValues: initialData,
  })

  const { createAddress, updateAddress } = useAddresses()

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      const newData = deepMergeSimple(initialData || {}, data)

      if (!skipSubmission) {
        if (addressID) {
          await updateAddress(addressID, newData)
        } else {
          await createAddress(newData)
        }
      }

      if (callback) {
        callback(newData)
      }
    },
    [initialData, skipSubmission, callback, addressID, updateAddress, createAddress],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <FormItem className="shrink">
            <Label htmlFor="title">Danh xưng</Label>

            <Select
              {...register('title')}
              onValueChange={(value) => {
                setValue('title', value, { shouldValidate: true })
              }}
              defaultValue={initialData?.title || ''}
            >
              <SelectTrigger id="title">
                <SelectValue placeholder="Danh xưng" />
              </SelectTrigger>
              <SelectContent>
                {titles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.title && <FormError message={errors.title.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor="firstName">Tên*</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              {...register('firstName', { required: 'Tên là bắt buộc.' })}
            />
            {errors.firstName && <FormError message={errors.firstName.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor="lastName">Họ*</Label>
            <Input
              autoComplete="family-name"
              id="lastName"
              {...register('lastName', { required: 'Họ là bắt buộc.' })}
            />
            {errors.lastName && <FormError message={errors.lastName.message} />}
          </FormItem>
        </div>

        <FormItem>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input type="tel" id="phone" autoComplete="mobile tel" {...register('phone')} />
          {errors.phone && <FormError message={errors.phone.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="company">Công ty</Label>
          <Input id="company" autoComplete="organization" {...register('company')} />
          {errors.company && <FormError message={errors.company.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="addressLine1">Địa chỉ 1*</Label>
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            {...register('addressLine1', { required: 'Địa chỉ 1 là bắt buộc.' })}
          />
          {errors.addressLine1 && <FormError message={errors.addressLine1.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="addressLine2">Địa chỉ 2</Label>
          <Input id="addressLine2" autoComplete="address-line2" {...register('addressLine2')} />
          {errors.addressLine2 && <FormError message={errors.addressLine2.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="city">Thành phố*</Label>
          <Input
            id="city"
            autoComplete="address-level2"
            {...register('city', { required: 'Thành phố là bắt buộc.' })}
          />
          {errors.city && <FormError message={errors.city.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="state">Tỉnh/Bang</Label>
          <Input id="state" autoComplete="address-level1" {...register('state')} />
          {errors.state && <FormError message={errors.state.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="postalCode">Mã bưu điện*</Label>
          <Input
            id="postalCode"
            {...register('postalCode', { required: 'Mã bưu điện là bắt buộc.' })}
          />
          {errors.postalCode && <FormError message={errors.postalCode.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="country">Quốc gia*</Label>

          <Select
            {...register('country', {
              required: 'Quốc gia là bắt buộc.',
            })}
            onValueChange={(value) => {
              setValue('country', value, { shouldValidate: true })
            }}
            required
            defaultValue={initialData?.country || ''}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Quốc gia" />
            </SelectTrigger>
            <SelectContent>
              {supportedCountries.map((country) => {
                const value = typeof country === 'string' ? country : country.value
                const label =
                  typeof country === 'string'
                    ? country
                    : typeof country.label === 'string'
                      ? country.label
                      : value

                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {errors.country && <FormError message={errors.country.message} />}
        </FormItem>
      </div>

      <Button type="submit">Gửi</Button>
    </form>
  )
}
