import fs from 'node:fs'
import path from 'node:path'

// Bước gap-fill ảnh cho các SKU thiếu imagePathFromExcel (file input không kèm ảnh, hoặc ảnh
// nhúng bị thiếu dòng). Nguồn ảnh: imageUrl đã cào sẵn ở Bước 1 (site cameraphanthiet.net —
// ưu tiên vì không watermark; các site WooCommerce còn lại thường dán watermark VUHOANGTELECOM/
// NHAANTOAN lên ảnh nên không dùng làm nguồn ảnh chính). Chạy sau Bước 1, trước Bước 3 (import).

const ENRICHED_DIR = path.resolve('.claude/skills/import-products-by-sku/tmp/enriched-by-sheet')
const SCRAPED_DIR = path.resolve('.claude/skills/import-products-by-sku/tmp/scraped-by-sheet')
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

const IMAGE_SITE_PRIORITY = ['cameraphanthiet.net']

function slugifySku(sku) {
  return (sku || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildImageUrlBySku() {
  const bySku = new Map()
  for (const file of fs.readdirSync(SCRAPED_DIR)) {
    if (!file.endsWith('.json')) continue
    const items = JSON.parse(fs.readFileSync(path.join(SCRAPED_DIR, file), 'utf-8'))
    for (const item of items) {
      if (bySku.has(item.sku)) continue
      const matches = item.matches || []
      for (const site of IMAGE_SITE_PRIORITY) {
        const m = matches.find((x) => x.site === site && x.matched && x.imageUrl)
        if (m) {
          bySku.set(item.sku, m.imageUrl)
          break
        }
      }
    }
  }
  return bySku
}

async function downloadImage(url, destPathNoExt) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const ext = (url.split('.').pop() || 'jpg').split(/[?#]/)[0].toLowerCase()
  const destPath = `${destPathNoExt}.${ext}`
  fs.writeFileSync(destPath, buffer)
  return destPath
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
  const imageUrlBySku = buildImageUrlBySku()

  const stillMissing = []
  let patched = 0

  for (const file of FULL_SHEET_FILES) {
    const filePath = path.join(ENRICHED_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.warn(`Bỏ qua ${file} — không tồn tại`)
      continue
    }
    const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    let changedInFile = false

    for (const item of items) {
      if (item.imagePathFromExcel) continue
      const imageUrl = imageUrlBySku.get(item.sku)
      if (!imageUrl) {
        stillMissing.push({ sheet: file, sku: item.sku })
        continue
      }
      const destPathNoExt = path.join(IMAGES_DIR, slugifySku(item.sku))
      try {
        const destPath = await downloadImage(imageUrl, destPathNoExt)
        item.imagePathFromExcel = destPath
        changedInFile = true
        patched++
        console.log(`${item.sku} -> ${destPath}`)
      } catch (err) {
        console.error(`${item.sku} — lỗi tải ảnh (${imageUrl}): ${err.message}`)
        stillMissing.push({ sheet: file, sku: item.sku })
      }
    }

    if (changedInFile) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8')
    }
  }

  console.log(`\nĐã tải + patch ${patched} ảnh.`)
  console.log(`Còn thiếu ${stillMissing.length} SKU (không có imageUrl cào được / tải lỗi):`)
  for (const m of stillMissing) console.log(`  - [${m.sheet}] ${m.sku}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
