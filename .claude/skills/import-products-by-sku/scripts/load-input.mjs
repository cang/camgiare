import ExcelJS from 'exceljs'
import fs from 'node:fs'
import path from 'node:path'

const HEADER_ALIASES = {
  'mã sản phẩm': 'sku',
  'thương hiệu': 'brandNameFromSheet',
  'mô tả': 'titleFromSheet',
  'chứng chỉ': 'certifications',
  'mô tả chi tiết': 'detailedDescriptionFromSheet',
  'bảo hành (tháng)': 'warrantyMonths',
  'giá lẻ (có vat)': 'priceInVNDFromSheet',
  'tình trạng hàng': 'stockStatusTextFromSheet',
}

function parseArgs(argv) {
  const args = { file: null, sheet: null, out: null }
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (key === 'file' && value) args.file = value
    if (key === 'sheet' && value) args.sheet = value
    if (key === 'out' && value) args.out = value
  }
  return args
}

function normalizeHeader(text) {
  return (text || '').toString().trim().toLowerCase()
}

function slugifySku(sku) {
  return (sku || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseVndNumber(text) {
  if (text === null || text === undefined) return undefined
  const digits = String(text).replace(/[^\d]/g, '')
  if (!digits) return undefined
  return parseInt(digits, 10)
}

function cellText(cell) {
  if (cell === null || cell === undefined) return ''
  const value = cell.text ?? cell.value
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part) => part.text).join('')
  }
  return String(value).trim()
}

// ----- Đường xlsx (có ảnh nhúng) -----
async function loadFromXlsx(filePath, imagesDir) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]

  let headerRowNumber
  let columnMap = {}
  worksheet.eachRow((row, rowNumber) => {
    if (headerRowNumber) return
    const candidate = {}
    row.eachCell((cell, colNumber) => {
      const key = HEADER_ALIASES[normalizeHeader(cellText(cell))]
      if (key) candidate[colNumber] = key
    })
    if (candidate && Object.values(candidate).includes('sku')) {
      headerRowNumber = rowNumber
      columnMap = candidate
    }
  })

  if (!headerRowNumber) throw new Error('Không tìm thấy dòng header (cần có cột "Mã sản phẩm")')

  const items = []
  const rowIndexToSku = new Map()

  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    const item = {}
    for (const [colNumber, key] of Object.entries(columnMap)) {
      item[key] = cellText(row.getCell(Number(colNumber)))
    }
    if (!item.sku) continue

    item.warrantyMonths = item.warrantyMonths ? parseInt(item.warrantyMonths, 10) : undefined
    item.priceInVNDFromSheet = parseVndNumber(item.priceInVNDFromSheet)
    item.imagePathFromExcel = undefined

    rowIndexToSku.set(rowNumber - 1, item.sku) // nativeRow (0-indexed) -> sku
    items.push(item)
  }

  const itemBySku = new Map(items.map((item) => [item.sku, item]))
  fs.mkdirSync(imagesDir, { recursive: true })

  for (const img of worksheet.getImages()) {
    const nativeRow = img.range.tl.nativeRow
    const sku = rowIndexToSku.get(nativeRow)
    if (!sku) continue

    const item = itemBySku.get(sku)
    if (!item || item.imagePathFromExcel) continue // giữ ảnh đầu tiên neo vào dòng đó nếu có nhiều

    const image = workbook.getImage(Number(img.imageId))
    if (!image?.buffer) continue

    const destPath = path.join(imagesDir, `${slugifySku(sku)}.${image.extension}`)
    fs.writeFileSync(destPath, image.buffer)
    item.imagePathFromExcel = destPath
  }

  return items
}

// ----- Đường CSV (từ file .csv cục bộ hoặc Google Sheet export) — không có ảnh -----
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // bỏ qua
    } else {
      field += c
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function loadFromCsvText(csvText) {
  const rows = parseCsv(csvText)

  let headerRowIndex = -1
  let columnMap = {}
  for (let i = 0; i < rows.length; i++) {
    const candidate = {}
    rows[i].forEach((cellValue, colIndex) => {
      const key = HEADER_ALIASES[normalizeHeader(cellValue)]
      if (key) candidate[colIndex] = key
    })
    if (Object.values(candidate).includes('sku')) {
      headerRowIndex = i
      columnMap = candidate
      break
    }
  }
  if (headerRowIndex === -1) throw new Error('Không tìm thấy dòng header (cần có cột "Mã sản phẩm")')

  const items = []
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const raw = rows[i]
    const item = {}
    for (const [colIndex, key] of Object.entries(columnMap)) {
      item[key] = (raw[Number(colIndex)] || '').trim()
    }
    if (!item.sku) continue
    item.warrantyMonths = item.warrantyMonths ? parseInt(item.warrantyMonths, 10) : undefined
    item.priceInVNDFromSheet = parseVndNumber(item.priceInVNDFromSheet)
    item.imagePathFromExcel = undefined
    items.push(item)
  }
  return items
}

async function resolveGoogleSheetCsvUrl(sheetUrl) {
  const redirected = await fetch(sheetUrl, { redirect: 'follow' })
  const finalUrl = redirected.url
  const match = finalUrl.match(/\/spreadsheets\/d\/([^/]+)/)
  if (!match) throw new Error(`Không nhận ra URL Google Sheet: ${finalUrl}`)
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.file && !args.sheet) throw new Error('Cần truyền --file=<path> hoặc --sheet=<url>')

  const outPath = args.out
    ? path.resolve(args.out)
    : path.resolve('.claude/skills/import-products-by-sku/tmp/input.json')
  const imagesDir = path.join(path.dirname(outPath), 'images')

  let items
  if (args.file && args.file.toLowerCase().endsWith('.xlsx')) {
    items = await loadFromXlsx(path.resolve(args.file), imagesDir)
  } else if (args.file) {
    items = loadFromCsvText(fs.readFileSync(path.resolve(args.file), 'utf-8'))
  } else {
    const csvUrl = await resolveGoogleSheetCsvUrl(args.sheet)
    const res = await fetch(csvUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${csvUrl}`)
    items = loadFromCsvText(await res.text())
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf-8')

  const withImage = items.filter((item) => item.imagePathFromExcel).length
  console.log(`Đã đọc ${items.length} sản phẩm (${withImage} có ảnh nhúng) -> ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
