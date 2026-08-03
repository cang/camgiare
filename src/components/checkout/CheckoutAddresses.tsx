'use client'

import { AddressItem } from '@/components/addresses/AddressItem'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Address } from '@/payload-types'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { useState } from 'react'

type Props = {
  selectedAddress?: Address
  setAddress: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
  heading?: string
  description?: string
  setSubmit?: React.Dispatch<React.SetStateAction<() => void | Promise<void>>>
}

export const CheckoutAddresses: React.FC<Props> = ({
  setAddress,
  heading = 'Địa chỉ',
  description = 'Vui lòng chọn hoặc thêm địa chỉ giao hàng và thanh toán của bạn.',
}) => {
  const { addresses } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return (
      <div>
        <p>Không tìm thấy địa chỉ nào. Vui lòng thêm một địa chỉ.</p>

        <CreateAddressModal />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-xl font-medium mb-2">{heading}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <AddressesModal setAddress={setAddress} />
    </div>
  )
}

const AddressesModal: React.FC<Props> = ({ setAddress }) => {
  const [open, setOpen] = useState(false)
  const handleOpenChange = (state: boolean) => {
    setOpen(state)
  }

  const closeModal = () => {
    setOpen(false)
  }
  const { addresses } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return <p>Không tìm thấy địa chỉ nào. Vui lòng thêm một địa chỉ.</p>
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={'outline'}>{'Chọn một địa chỉ'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{'Chọn một địa chỉ'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-12">
          <ul className="flex flex-col gap-8">
            {addresses.map((address) => (
              <li key={address.id} className="border-b pb-8 last:border-none">
                <AddressItem
                  address={address}
                  beforeActions={
                    <Button
                      onClick={(e) => {
                        e.preventDefault()
                        setAddress(address)
                        closeModal()
                      }}
                    >
                      Chọn
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>

          <CreateAddressModal />
        </div>
      </DialogContent>
    </Dialog>
  )
}
