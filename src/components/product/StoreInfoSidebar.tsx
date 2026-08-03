import { TruckIcon, ShieldCheckIcon, RotateCcwIcon, PhoneIcon } from 'lucide-react'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'

export const StoreInfoSidebar: React.FC = async () => {
  const storeInfo = await getCachedGlobal('store-info', 0)()

  const items = [
    { icon: TruckIcon, text: storeInfo.shippingNote },
    { icon: ShieldCheckIcon, text: storeInfo.warrantyNote },
    { icon: RotateCcwIcon, text: storeInfo.returnNote },
  ].filter((item) => item.text)

  if (!items.length && !storeInfo.hotline) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 text-sm">
      {items.map(({ icon: Icon, text }, index) => (
        <div className="flex items-center gap-2" key={index}>
          <Icon className="h-4 w-4 shrink-0 text-primary/60" />
          <span>{text}</span>
        </div>
      ))}
      {storeInfo.hotline && (
        <a className="flex items-center gap-2 font-medium text-primary" href={`tel:${storeInfo.hotline}`}>
          <PhoneIcon className="h-4 w-4 shrink-0" />
          <span>Tư vấn mua hàng: {storeInfo.hotline}</span>
        </a>
      )}
    </div>
  )
}
