import { Banner } from '@payloadcms/ui'
import React from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

export const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Chào mừng bạn đến với bảng điều khiển!</h4>
      </Banner>
      Đây là những việc cần làm tiếp theo:
      <ul className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {' với một vài sản phẩm và trang mẫu để khởi động dự án mới của bạn, sau đó '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">truy cập website của bạn</a>
          {' để xem kết quả.'}
        </li>
        <li>
          {'Truy cập '}
          <a
            href="https://dashboard.stripe.com/test/apikeys"
            rel="noopener noreferrer"
            target="_blank"
          >
            Stripe để lấy API Keys của bạn
          </a>
          {
            '. Tạo tài khoản mới nếu cần, sau đó sao chép các khóa này vào biến môi trường và khởi động lại server. Xem thêm '
          }
          <a
            href="https://github.com/payloadcms/payload/blob/3.x/templates/ecommerce/README.md#stripe"
            rel="noopener noreferrer"
            target="_blank"
          >
            README
          </a>
          {' để biết thêm chi tiết.'}
        </li>
        <li>
          {'Chỉnh sửa '}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            rel="noopener noreferrer"
            target="_blank"
          >
            collections
          </a>
          {' và thêm nhiều '}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            rel="noopener noreferrer"
            target="_blank"
          >
            fields
          </a>
          {' khi cần. Nếu bạn mới làm quen với Payload, chúng tôi cũng khuyên bạn nên xem qua '}
          <a
            href="https://payloadcms.com/docs/getting-started/what-is-payload"
            rel="noopener noreferrer"
            target="_blank"
          >
            Getting Started
          </a>
          {' docs.'}
        </li>
      </ul>
      {'Mẹo nhỏ: Khối này là một '}
      <a
        href="https://payloadcms.com/docs/admin/components#base-component-overrides"
        rel="noopener noreferrer"
        target="_blank"
      >
        custom component
      </a>
      , bạn có thể xóa nó bất cứ lúc nào bằng cách cập nhật <strong>payload.config</strong>.
    </div>
  )
}
