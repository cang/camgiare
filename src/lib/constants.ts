export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Tên A-Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Mới nhất' },
  { slug: 'priceInVND', reverse: false, title: 'Giá: Thấp đến cao' }, // asc
  { slug: '-priceInVND', reverse: true, title: 'Giá: Cao đến thấp' },
]
