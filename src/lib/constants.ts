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

export type PriceRangeItem = { key: string; max?: number; min?: number; title: string }

export const priceRanges: PriceRangeItem[] = [
  { key: 'duoi-1', title: 'Dưới 1 triệu', max: 999999 },
  { key: '1-2', title: '1 - 2 triệu', min: 1000000, max: 1999999 },
  { key: '2-5', title: '2 - 5 triệu', min: 2000000, max: 4999999 },
  { key: 'tren-5', title: 'Trên 5 triệu', min: 5000000 },
]
