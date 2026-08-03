import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { Order } from '@/payload-types'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { AddressListing } from '@/components/addresses/AddressListing'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'

export default async function AddressesPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Vui lòng đăng nhập để truy cập cài đặt tài khoản của bạn.')}`,
    )
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 5,
      user,
      overrideAccess: false,
      pagination: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {
    // khi triển khai template này trên Payload Cloud, trang này cần được build trước khi các API hoạt động
    // nên ở đây ta bỏ qua lỗi và chỉ render trang với dữ liệu dự phòng khi cần thiết
    // trong môi trường production bạn có thể muốn redirect đến trang 404 hoặc ít nhất là ghi log lỗi ở đâu đó
    // console.error(error)
  }

  return (
    <>
      <div className="border p-8 rounded-lg bg-primary-foreground">
        <h1 className="text-3xl font-medium mb-8">Địa chỉ</h1>

        <div className="mb-8">
          <AddressListing />
        </div>

        <CreateAddressModal />
      </div>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Quản lý địa chỉ của bạn.',
  openGraph: mergeOpenGraph({
    title: 'Địa chỉ',
    url: '/account/addresses',
  }),
  title: 'Địa chỉ',
}
