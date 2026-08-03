import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * ID của document khớp với ID của user hoặc user là admin.
 *
 * Hữu ích để cho phép user quản lý tài khoản của chính mình, nhưng không được quản lý tài khoản của người khác.
 */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }

    return {
      id: {
        equals: user.id,
      },
    }
  }

  return false
}
