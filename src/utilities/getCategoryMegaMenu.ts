import type { Payload } from 'payload'

import type { Category } from '@/payload-types'

export type MegaMenuColumn = {
  title: string
  slug: string | null | undefined
  children: Array<{ title: string; slug: string | null | undefined }>
}

function parentId(category: Category): string | number | undefined {
  const { parent } = category
  if (!parent) return undefined
  return typeof parent === 'object' ? parent.id : parent
}

/**
 * Dựng cột cho mega-menu "Sản phẩm" từ cây category (field `parent`): con của mỗi
 * category gốc trở thành 1 cột (tên cột), con của category đó trở thành các link liệt
 * kê trong cột. Category gốc không hiện — chỉ có ý nghĩa cấu trúc, không phải điểm bấm.
 */
export async function getCategoryMegaMenu(payload: Payload): Promise<MegaMenuColumn[]> {
  const { docs: categories } = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 200,
    sort: 'title',
  })

  const childrenOf = new Map<string | number | 'root', Category[]>()
  for (const category of categories) {
    const key = parentId(category) ?? 'root'
    if (!childrenOf.has(key)) childrenOf.set(key, [])
    childrenOf.get(key)!.push(category)
  }

  const roots = childrenOf.get('root') ?? []

  return roots.flatMap((root) => {
    const columns = childrenOf.get(root.id) ?? []
    if (columns.length === 0) {
      // Category gốc không có con nào — coi chính nó là 1 cột đơn (không có link con).
      return [{ title: root.title, slug: root.slug, children: [] }]
    }
    return columns.map((column) => ({
      title: column.title,
      slug: column.slug,
      children: (childrenOf.get(column.id) ?? []).map((child) => ({
        title: child.title,
        slug: child.slug,
      })),
    }))
  })
}
