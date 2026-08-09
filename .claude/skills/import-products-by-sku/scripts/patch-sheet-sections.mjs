import fs from 'node:fs'
import path from 'node:path'

// Gắn lại nhãn "Nhóm sản phẩm" (sheetSection — tiêu đề phân nhóm nhỏ trong cùng sheet, VD
// "CAMERA 2 INCH PT", "SWITCH QUẢN LÝ THÔNG MINH GIGABIT") vào specifications của từng sản
// phẩm, lấy từ 1 lần chạy lại load-input.mjs (đã fix isSectionHeaderRow) trên đúng file nguồn.
// Chỉ cộng thêm 1 dòng spec — không đụng categoryPath/brand/mô tả đã enrich trước đó.

const REFIXED_INPUT = path.resolve('.claude/skills/import-products-by-sku/tmp/input-hun-refixed.json')
const ENRICHED_DIR = path.resolve('.claude/skills/import-products-by-sku/tmp/enriched-by-sheet')

const SHEET_TARGETS = [
  { sheetName: 'Cam IP - HUN', enrichedFile: 'cam-ip-hun.json' },
  { sheetName: 'Switch', enrichedFile: 'switch.json' },
]

function main() {
  const refixedItems = JSON.parse(fs.readFileSync(REFIXED_INPUT, 'utf-8'))

  for (const { sheetName, enrichedFile } of SHEET_TARGETS) {
    const sectionBySku = new Map()
    for (const item of refixedItems) {
      if (item.sheetName === sheetName && item.sheetSection) {
        sectionBySku.set(item.sku, item.sheetSection)
      }
    }

    const enrichedPath = path.join(ENRICHED_DIR, enrichedFile)
    const enrichedItems = JSON.parse(fs.readFileSync(enrichedPath, 'utf-8'))

    let patched = 0
    let noSection = 0
    for (const item of enrichedItems) {
      const section = sectionBySku.get(item.sku)
      if (!section) {
        noSection++
        continue
      }
      item.specifications = item.specifications || []
      const already = item.specifications.some((s) => s.label === 'Nhóm sản phẩm')
      if (already) continue
      item.specifications.unshift({ label: 'Nhóm sản phẩm', value: section })
      patched++
    }

    fs.writeFileSync(enrichedPath, JSON.stringify(enrichedItems, null, 2), 'utf-8')
    console.log(`${enrichedFile}: đã gắn nhóm cho ${patched}/${enrichedItems.length} sản phẩm (${noSection} không có section)`)
  }
}

main()
