import type { Payload } from 'payload'

import type { Category } from '@/payload-types'

type CategoryRef = Category | number | string | null | undefined

/**
 * Đi ngược từ 1 category lên root theo field `parent`, trả về mảng thứ tự
 * root -> lá (bao gồm chính category truyền vào). Có chặn vòng lặp (dữ liệu
 * parent bị gán sai thành con của chính nó) bằng visited set + giới hạn độ sâu.
 */
export const getCategoryPath = async (
  payload: Payload,
  category: CategoryRef,
): Promise<Category[]> => {
  const path: Category[] = []
  const visited = new Set<number | string>()

  let current: CategoryRef = category

  while (current && path.length < 20) {
    const currentDoc: Category | null =
      typeof current === 'object'
        ? current
        : await payload
            .findByID({ id: current, collection: 'categories', depth: 0 })
            .catch(() => null)

    if (!currentDoc || visited.has(currentDoc.id)) break

    visited.add(currentDoc.id)
    path.unshift(currentDoc)
    current = currentDoc.parent
  }

  return path
}
