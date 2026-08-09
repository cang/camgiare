import fs from 'node:fs'
import path from 'node:path'

// Patch imagePathFromExcel cho các SKU mà user tự chép ảnh tay vào tmp/images-manual/
// (đặt tên file = slugifySku(sku), đuôi tuỳ ý) — dùng sau khi gapfill-images-from-scraped.mjs
// đã xử lý xong phần lấy được imageUrl tự động, còn lại các SKU không site nào có ảnh.

const ENRICHED_DIR = path.resolve('.claude/skills/import-products-by-sku/tmp/enriched-by-sheet')
const IMAGES_DIR = path.resolve('.claude/skills/import-products-by-sku/tmp/images-manual')

const FULL_SHEET_FILES = [
  'cam-ip.json',
  'cam-ip-hun.json',
  'cam-tvi.json',
  'cam1-ipc.json',
  'cap-mang.json',
  'dvr.json',
  'nvr.json',
  'router-wifi.json',
  'switch.json',
  'wifi-camera.json',
]

function slugifySku(sku) {
  return (sku || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildFileBySlug() {
  const bySlug = new Map()
  for (const file of fs.readdirSync(IMAGES_DIR)) {
    const ext = path.extname(file)
    const slug = path.basename(file, ext)
    bySlug.set(slug, path.join(IMAGES_DIR, file))
  }
  return bySlug
}

function main() {
  const fileBySlug = buildFileBySlug()
  const stillMissing = []
  let patched = 0

  for (const file of FULL_SHEET_FILES) {
    const filePath = path.join(ENRICHED_DIR, file)
    if (!fs.existsSync(filePath)) continue
    const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    let changedInFile = false

    for (const item of items) {
      if (item.imagePathFromExcel) continue
      const slug = slugifySku(item.sku)
      const found = fileBySlug.get(slug)
      if (!found) {
        stillMissing.push({ sheet: file, sku: item.sku })
        continue
      }
      item.imagePathFromExcel = found
      changedInFile = true
      patched++
      console.log(`${item.sku} -> ${found}`)
    }

    if (changedInFile) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8')
    }
  }

  console.log(`\nĐã patch ${patched} ảnh tay.`)
  console.log(`Còn thiếu ${stillMissing.length} SKU:`)
  for (const m of stillMissing) console.log(`  - [${m.sheet}] ${m.sku}`)
}

main()
