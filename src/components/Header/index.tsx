import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { getCategoryMegaMenu } from '@/utilities/getCategoryMegaMenu'

import './index.css'
import { HeaderClient } from './index.client'

export async function Header() {
  const header = await getCachedGlobal('header', 1)()
  const payload = await getPayload({ config: configPromise })
  const productCategories = await getCategoryMegaMenu(payload)

  return <HeaderClient header={header} productCategories={productCategories} />
}
