import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { AccountForm } from '@/components/forms/AccountForm'
import { Order } from '@/payload-types'
import { OrderItem } from '@/components/OrderItem'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
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
        <h1 className="text-3xl font-medium mb-8">Cài đặt tài khoản</h1>
        <AccountForm />
      </div>

      <div className=" border p-8 rounded-lg bg-primary-foreground">
        <h2 className="text-3xl font-medium mb-8">Đơn hàng gần đây</h2>

        <div className="prose dark:prose-invert mb-8">
          <p>
            Đây là những đơn hàng gần đây nhất bạn đã đặt. Mỗi đơn hàng gắn liền với một lần thanh
            toán. Khi bạn đặt thêm đơn hàng, chúng sẽ xuất hiện trong danh sách đơn hàng của bạn.
          </p>
        </div>

        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="mb-8">Bạn chưa có đơn hàng nào.</p>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-6 mb-8">
            {orders?.map((order, index) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="default">
          <Link href="/orders">Xem tất cả đơn hàng</Link>
        </Button>
      </div>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Tạo tài khoản hoặc đăng nhập vào tài khoản hiện có của bạn.',
  openGraph: mergeOpenGraph({
    title: 'Tài khoản',
    url: '/account',
  }),
  title: 'Tài khoản',
}
