import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Access checker đơn giản kiểm tra xem user có role admin hay không.
 *
 * @returns true nếu user là admin, ngược lại false
 */
export const isAdmin: Access = ({ req }) => {
  if (req.user) {
    return checkRole(['admin'], req.user)
  }

  return false
}
