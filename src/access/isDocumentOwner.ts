import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Access checker đơn giản kiểm tra xem user có sở hữu document đang được truy cập hay không.
 * Trả về một Where query để lọc document theo field customer.
 *
 * Admin có toàn quyền truy cập, user đã xác thực (authenticated) sẽ bị lọc theo field customer,
 * còn user chưa xác thực sẽ bị từ chối truy cập.
 *
 * @returns true cho admin, Where query cho customer, false cho khách (guest)
 */
export const isDocumentOwner: Access = ({ req }) => {
  // Admin có toàn quyền truy cập
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }

  // User đã xác thực - trả về Where query để lọc theo customer
  if (req.user?.id) {
    return {
      customer: {
        equals: req.user.id,
      },
    }
  }

  // Khách (guest) - không có quyền truy cập
  return false
}
