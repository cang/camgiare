import fs from 'node:fs'
import path from 'node:path'

// Precompute các field xác định được chắc chắn (giá, tồn kho, category, brand, ảnh) từ
// input.json + scraped.json, để agent viết nội dung (Bước 2) chỉ còn phải quyết định phần
// cần phán đoán (title/shortDescription/description/specifications) — không đụng vào field
// đã tính đúng sẵn. Pattern giống lô EZVIZ trước (xem SKILL memory).

const SITE_PRIORITY = ['vuhoangtelecom.vn', 'nhaantoan.com', 'sieuthivienthong.com', 'cameraphanthiet.net']

function parseArgs(argv) {
  const args = {}
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (value !== undefined) args[key] = value
  }
  return args
}

function pickPriceInVND(item, matchedList) {
  for (const site of SITE_PRIORITY) {
    const m = matchedList.find((x) => x.site === site)
    if (m && typeof m.priceInVND === 'number') return m.priceInVND
  }
  return typeof item.priceInVNDFromSheet === 'number' ? item.priceInVNDFromSheet : undefined
}

function pickInStock(item, matchedList) {
  const withStock = matchedList.find((m) => typeof m.inStock === 'boolean')
  if (withStock) return withStock.inStock
  const text = (item.stockStatusTextFromSheet || '').toLowerCase()
  if (text.includes('hết') || text.includes('ngừng')) return false
  return true
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.input || !args.scraped) throw new Error('Cần --input=<input.json theo sheet> --scraped=<scraped.json theo sheet>')

  const inputItems = JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf-8'))
  const scrapedResults = JSON.parse(fs.readFileSync(path.resolve(args.scraped), 'utf-8'))
  const scrapedBySku = new Map(scrapedResults.map((r) => [r.sku, r]))

  const base = inputItems.map((item) => {
    const r = scrapedBySku.get(item.sku)
    const matches = r?.matches || []
    const matchedList = matches.filter((m) => m.matched)

    return {
      sku: item.sku,
      brandName: r?.brandName || item.brandNameFromSheet,
      categoryPath: r?.categoryPath || [],
      priceInVND: pickPriceInVND(item, matchedList),
      inStock: pickInStock(item, matchedList),
      imagePathFromExcel: item.imagePathFromExcel,
      warrantyText: item.warrantyText,
      warrantyMonths: item.warrantyMonths,
      sourceMatches: matchedList.map((m) => ({
        site: m.site,
        sourceUrl: m.sourceUrl,
        title: m.title,
        shortDescriptionBullets: m.shortDescriptionBullets,
        specifications: m.specifications,
        descriptionText: m.descriptionText,
        imageUrl: m.imageUrl,
      })),
      detailedDescriptionFromSheet: item.detailedDescriptionFromSheet,
      extraFields: item.extraFields || [],
    }
  })

  const outPath = path.resolve(args.out || '.claude/skills/import-products-by-sku/tmp/base.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(base, null, 2), 'utf-8')

  const withImage = base.filter((b) => b.imagePathFromExcel).length
  const withPrice = base.filter((b) => typeof b.priceInVND === 'number').length
  const withSiteMatch = base.filter((b) => b.sourceMatches.length).length
  console.log(
    `Đã ghi ${base.length} sản phẩm -> ${outPath} (${withImage} có ảnh, ${withPrice} có giá, ${withSiteMatch} khớp >=1 site)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
