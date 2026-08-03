'use client'

import React from 'react'
import type { Address } from '@/payload-types'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'

type Props = {
  address: Partial<Omit<Address, 'country'>> & { country?: string } // Cho phép address là partial và hoàn toàn tùy chọn vì chỉ dùng để hiển thị
  /**
   * Ghi đè hoàn toàn các action mặc định
   */
  actions?: React.ReactNode
  /**
   * Chèn thêm phần tử trước các action
   */
  beforeActions?: React.ReactNode
  /**
   * Chèn thêm phần tử sau các action
   */
  afterActions?: React.ReactNode
  /**
   * Ẩn toàn bộ các action
   */
  hideActions?: boolean
}

export const AddressItem: React.FC<Props> = ({
  address,
  actions,
  hideActions = false,
  beforeActions,
  afterActions,
}) => {
  if (!address) {
    return null
  }

  return (
    <div className="flex items-center">
      <div className="grow">
        <p className="font-medium">
          {address.title && <span>{address.title} </span>}
          {address.firstName} {address.lastName}
        </p>
        <p>{address.company && <span>{address.company} </span>}</p>
        <p>{address.phone && <span>{address.phone}</span>}</p>
        <p>
          {address.addressLine1}
          {address.addressLine2 && <>, {address.addressLine2}</>}
        </p>
        <p>
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p>{address.country}</p>
      </div>

      {!hideActions && address.id && (
        <div className="shrink flex flex-col gap-2">
          {actions ? (
            actions
          ) : (
            <>
              {beforeActions}
              {address.id && (
                <CreateAddressModal
                  addressID={address.id}
                  initialData={address}
                  buttonText={'Sửa'}
                  modalTitle={'Sửa địa chỉ'}
                />
              )}
              {afterActions}
            </>
          )}
        </div>
      )}
    </div>
  )
}
