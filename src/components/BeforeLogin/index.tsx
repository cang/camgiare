import React from 'react'

export const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Chào mừng bạn đến với bảng điều khiển!</b>
        {' Đây là nơi quản trị viên website đăng nhập để quản lý cửa hàng của bạn. Khách hàng sẽ cần '}
        <a href={`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/login`}>đăng nhập vào trang web thay vào đó</a>
        {' để truy cập tài khoản người dùng, lịch sử đơn hàng và nhiều hơn nữa.'}
      </p>
    </div>
  )
}
