import ExcelJS from 'exceljs'
import fs from 'node:fs'
import path from 'node:path'

// Alias "cứng" — mỗi header chỉ map vào đúng 1 field cụ thể. Cột không nằm trong danh sách
// này (và không phải cột ảnh) được giữ lại nguyên vẹn vào `extraFields` thay vì bị bỏ qua —
// mỗi file báo giá nhà cung cấp có bộ cột khác nhau (VD "Độ phân giải", "Chức năng", "Tần
// số", "Pin"...), không thể liệt kê hết trước; extraFields để Bước 2 (agent) tự quyết định
// đưa vào specifications hay description.
const CORE_ALIASES = {
  'mã sản phẩm': 'sku',
  'mã hàng': 'sku',
  'thương hiệu': 'brandNameFromSheet',
  'tên sản phẩm': 'titleFromSheet',
  'mô tả chi tiết': 'detailedDescriptionFromSheet',
  'chứng chỉ': 'certifications',
  'bảo hành (tháng)': 'warrantyMonths',
  'bảo hành': 'warrantyText',
  'giá lẻ (có vat)': 'priceInVNDFromSheet',
  'giá bán lẻ': 'priceInVNDFromSheet',
  'giá bán lẻ (đã gồm vat)': 'priceInVNDFromSheet',
  'giá bán lẻ vat 8%': 'priceInVNDFromSheet',
  'tình trạng hàng': 'stockStatusTextFromSheet',
  'tình trạng': 'stockStatusTextFromSheet',
  'hình ảnh': 'imageColumn', // không map vào field text nào — ảnh lấy qua embedded image, xử lý riêng
}

function parseArgs(argv) {
  const args = { file: null, sheet: null, out: null, defaultBrand: null }
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (key === 'file' && value) args.file = value
    if (key === 'sheet' && value) args.sheet = value
    if (key === 'out' && value) args.out = value
    if (key === 'default-brand' && value) args.defaultBrand = value
  }
  return args
}

// Gộp khoảng trắng (kể cả xuống dòng trong 1 ô header, VD "Giá bán lẻ\n(đã gồm VAT)") thành 1
// dấu cách trước khi so alias — nếu không, các biến thể xuống dòng/nhiều dấu cách sẽ rơi tọt
// vào extraFields thay vì field priceInVNDFromSheet dù về ý nghĩa là cùng 1 cột giá.
function normalizeHeader(text) {
  return (text || '')
    .toString()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
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
  // Ưu tiên đọc `cell.value` (và tự xử lý richText) thay vì `cell.text` — getter `.text` của
  // exceljs bị lỗi thật trên ô merge chứa richText: trả về chuỗi "[object Object]" thay vì
  // nội dung, gặp ở 1 ô "CHỨC NĂNG" của lô EZVIZ. Cũng bọc try/catch vì ô merge trỏ tới
  // master cell rỗng/đã xoá có thể khiến getter throw (gặp ở merged cell rỗng đầu sheet).
  let value
  try {
    value = cell.value
  } catch {
    return ''
  }
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part) => part.text).join('').normalize('NFC').trim()
  }
  if (typeof value === 'object') {
    try {
      const text = cell.text
      if (typeof text === 'string' && text && text !== '[object Object]') return text.normalize('NFC').trim()
    } catch {
      // bỏ qua
    }
    return ''
  }
  return String(value).normalize('NFC').trim()
}

// Dò dòng header trong 1 tập cell {colNumber/colIndex -> text}: cần có ít nhất 1 cột map
// được vào "sku". Trả về columnMap (core field) + extraColumns (header gốc, giữ nguyên chữ
// hoa/thường để làm label hiển thị).
function resolveHeaderRow(headerCells) {
  const columnMap = {}
  const extraColumns = {}
  let hasTitleColumn = false

  for (const [, rawText] of headerCells) {
    const key = CORE_ALIASES[normalizeHeader(rawText)]
    if (key === 'titleFromSheet') hasTitleColumn = true
  }

  for (const [col, rawText] of headerCells) {
    const normalized = normalizeHeader(rawText)
    if (!normalized) continue
    let key = CORE_ALIASES[normalized]
    // "Mô tả" thường là tên tạm khi không có cột "Tên sản phẩm" riêng (lô HIKFIRE cũ); khi
    // đã có "Tên sản phẩm" thì "Mô tả" là mô tả/thông số chi tiết (lô EZVIZ).
    if (normalized === 'mô tả') key = hasTitleColumn ? 'detailedDescriptionFromSheet' : 'titleFromSheet'
    if (key && key !== 'imageColumn') {
      columnMap[col] = key
    } else if (!key) {
      extraColumns[col] = rawText.toString().normalize('NFC').trim()
    }
  }
  return { columnMap, extraColumns, ok: Object.values(columnMap).includes('sku') }
}

// Dòng tiêu đề phân nhóm con chèn giữa dữ liệu (VD "Camera trong nhà"), không phải sản phẩm.
// 2 dạng đã gặp:
//  1) Chỉ có 1 ô ở cột sku, không có số, mọi field khác rỗng (VD lô HIKFIRE cũ).
//  2) Excel merge nguyên cả hàng (A:F) làm tiêu đề — khi đọc theo cột, MỌI cột (kể cả giá/mô
//     tả) đều trả về CHÍNH XÁC cùng 1 chữ với cột mã sản phẩm, khác hẳn 1 dòng sản phẩm thật
//     (không cột nào trùng chữ với mã sản phẩm). Dạng này có thể chứa số trong tên (VD "CAMERA
//     2 INCH PT", "CAMERA 2xx1" ở lô Hikvision - Nhà An Toàn) nên không thể chỉ loại theo "sku
//     không có số" như dạng 1 — phải nhận diện qua dấu hiệu merge-trùng-chữ này là chính.
function isSectionHeaderRow(item, extraFieldsCount) {
  const skuText = (item.sku || '').trim()
  if (!skuText) return false

  const otherValues = Object.entries(item)
    .filter(([k, v]) => k !== 'sku' && k !== 'imagePathFromExcel' && v !== undefined && v !== '')
    .map(([, v]) => v)

  const isMergedDuplicateRow =
    otherValues.length > 0 && otherValues.every((v) => typeof v === 'string' && v.trim() === skuText)
  if (isMergedDuplicateRow) return true

  // Dạng 1 (chỉ 1 ô ở cột sku, các cột khác rỗng thật sự — không phải merge): không dùng "có
  // số hay không" để loại nữa, vì gặp tiêu đề "SWITCH QUẢN LÝ THÔNG MINH 100M" (có số "100")
  // ở lô Hikvision - Nhà An Toàn bị lọt do heuristic cũ. 1 dòng sản phẩm thật luôn có ít nhất
  // giá ("Liên hệ"/số) hoặc tình trạng hàng — rỗng toàn bộ các cột đó là dấu hiệu đủ tin cậy.
  return otherValues.length === 0 && extraFieldsCount === 0
}

// ----- Đường xlsx (có ảnh nhúng, có thể nhiều sheet) -----
async function loadFromXlsx(filePath, imagesDir) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

  const items = []

  for (const worksheet of workbook.worksheets) {
    let headerRowNumber
    let columnMap = {}
    let extraColumns = {}

    worksheet.eachRow((row, rowNumber) => {
      if (headerRowNumber) return
      const headerCells = []
      row.eachCell((cell, colNumber) => headerCells.push([colNumber, cellText(cell)]))
      const resolved = resolveHeaderRow(headerCells)
      if (resolved.ok) {
        headerRowNumber = rowNumber
        columnMap = resolved.columnMap
        extraColumns = resolved.extraColumns
      }
    })

    if (!headerRowNumber) {
      console.warn(`Sheet "${worksheet.name}" — không tìm thấy dòng header (cần cột mã sản phẩm), bỏ qua sheet này`)
      continue
    }

    const sheetItems = []
    const rowIndexToItem = new Map()
    let currentSection

    for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const item = {}
      for (const [colNumber, key] of Object.entries(columnMap)) {
        item[key] = cellText(row.getCell(Number(colNumber)))
      }
      const extraFields = []
      for (const [colNumber, label] of Object.entries(extraColumns)) {
        const value = cellText(row.getCell(Number(colNumber)))
        if (value) extraFields.push({ label, value })
      }
      if (!item.sku) continue

      if (isSectionHeaderRow(item, extraFields.length)) {
        currentSection = item.sku.replace(/\s+/g, ' ').trim()
        continue
      }

      item.sku = item.sku.replace(/\s+/g, ' ').trim()
      if (item.titleFromSheet) item.titleFromSheet = item.titleFromSheet.replace(/\s+/g, ' ').trim()
      item.warrantyMonths = item.warrantyMonths ? parseInt(item.warrantyMonths, 10) : undefined
      item.priceInVNDFromSheet = parseVndNumber(item.priceInVNDFromSheet)
      item.extraFields = extraFields
      item.sheetName = worksheet.name.normalize('NFC').trim()
      item.sheetSection = currentSection
      item.imagePathFromExcel = undefined

      rowIndexToItem.set(rowNumber - 1, item) // nativeRow (0-indexed) -> item
      sheetItems.push(item)
    }

    fs.mkdirSync(imagesDir, { recursive: true })
    for (const img of worksheet.getImages()) {
      const nativeRow = img.range.tl.nativeRow
      const item = rowIndexToItem.get(nativeRow)
      if (!item || item.imagePathFromExcel) continue // giữ ảnh đầu tiên neo vào dòng đó nếu có nhiều

      const image = workbook.getImage(Number(img.imageId))
      if (!image?.buffer) continue

      const destPath = path.join(imagesDir, `${slugifySku(item.sku)}.${image.extension}`)
      fs.writeFileSync(destPath, image.buffer)
      item.imagePathFromExcel = destPath
    }

    console.log(`Sheet "${worksheet.name}" — đọc ${sheetItems.length} sản phẩm`)
    items.push(...sheetItems)
  }

  return items
}

// ----- Đường CSV (từ file .csv cục bộ hoặc Google Sheet export) — 1 sheet, không có ảnh -----
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
  let extraColumns = {}
  for (let i = 0; i < rows.length; i++) {
    const headerCells = rows[i].map((cellValue, colIndex) => [colIndex, cellValue])
    const resolved = resolveHeaderRow(headerCells)
    if (resolved.ok) {
      headerRowIndex = i
      columnMap = resolved.columnMap
      extraColumns = resolved.extraColumns
      break
    }
  }
  if (headerRowIndex === -1) throw new Error('Không tìm thấy dòng header (cần có cột "Mã sản phẩm")')

  const items = []
  let currentSection
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const raw = rows[i]
    const item = {}
    for (const [colIndex, key] of Object.entries(columnMap)) {
      item[key] = (raw[Number(colIndex)] || '').normalize('NFC').trim()
    }
    const extraFields = []
    for (const [colIndex, label] of Object.entries(extraColumns)) {
      const value = (raw[Number(colIndex)] || '').normalize('NFC').trim()
      if (value) extraFields.push({ label, value })
    }
    if (!item.sku) continue

    if (isSectionHeaderRow(item, extraFields.length)) {
      currentSection = item.sku.replace(/\s+/g, ' ').trim()
      continue
    }

    item.sku = item.sku.replace(/\s+/g, ' ').trim()
    if (item.titleFromSheet) item.titleFromSheet = item.titleFromSheet.replace(/\s+/g, ' ').trim()
    item.warrantyMonths = item.warrantyMonths ? parseInt(item.warrantyMonths, 10) : undefined
    item.priceInVNDFromSheet = parseVndNumber(item.priceInVNDFromSheet)
    item.extraFields = extraFields
    item.sheetSection = currentSection
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

  if (args.defaultBrand) {
    for (const item of items) {
      if (!item.brandNameFromSheet) item.brandNameFromSheet = args.defaultBrand
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf-8')

  const withImage = items.filter((item) => item.imagePathFromExcel).length
  console.log(`\nĐã đọc ${items.length} sản phẩm (${withImage} có ảnh nhúng) -> ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
