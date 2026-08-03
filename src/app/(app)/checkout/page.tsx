import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Fragment } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return (
    <div className="container min-h-[90vh] flex">
      {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
        <div>
          <Fragment>
            {'Để bật chức năng thanh toán, bạn cần '}
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              rel="noopener noreferrer"
              target="_blank"
            >
              lấy Stripe API Keys của bạn
            </a>
            {' sau đó thiết lập chúng làm biến môi trường. Xem '}
            <a
              href="https://github.com/payloadcms/payload/blob/3.x/templates/ecommerce/README.md#stripe"
              rel="noopener noreferrer"
              target="_blank"
            >
              README
            </a>
            {' để biết thêm chi tiết.'}
          </Fragment>
        </div>
      )}

      <h1 className="sr-only">Thanh toán</h1>

      <CheckoutPage />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Thanh toán.',
  openGraph: mergeOpenGraph({
    title: 'Thanh toán',
    url: '/checkout',
  }),
  title: 'Thanh toán',
}
