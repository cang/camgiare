import configPromise from '@payload-config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

function parseArgs(argv) {
  const args = { input: null, limit: undefined }
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (key === 'input' && value) args.input = value
    if (key === 'limit' && value) args.limit = parseInt(value, 10)
  }
  return args
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

function textToRichText(text) {
  const paragraphs = (text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return {
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: paragraphs.map((paragraph) => ({
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: paragraph, version: 1 },
        ],
      })),
    },
  }
}

// Chuẩn hoá Unicode NFC trước khi so khớp/tạo — chuỗi cào từ web và chuỗi tự gõ có thể
// trông giống nhau nhưng khác byte (NFD vs NFC), khiến so khớp "equals" ở DB và cache
// đều fail âm thầm rồi tạo trùng document mới.
function normalizeName(name) {
  return (name || '').normalize('NFC').trim()
}

async function findOrCreateBrand(payload, rawName, cache) {
  const name = normalizeName(rawName)
  if (!name) return undefined
  const key = name.toLowerCase()
  if (cache.has(key)) return cache.get(key)

  const existing = await payload.find({ collection: 'brands', limit: 200 })
  const match = existing.docs.find((doc) => doc.name.toLowerCase() === key)

  const brand = match ?? (await payload.create({ collection: 'brands', data: { name } }))
  cache.set(key, brand)
  return brand
}

function slugifyText(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Categories.slug có unique index TOÀN CỤC (không scope theo parent — xem Categories.ts,
// dùng slugField() mặc định của payload). Nghĩa là 2 nhánh khác nhau (VD "Camera Hikvision"
// và "Camera EZVIZ") đều có thể muốn tạo 1 category lá cùng tên (VD "Camera ngoài trời") mà
// vẫn đụng nhau ở slug dù title+parent khác — payload.create sẽ ném lỗi "Value must be unique".
// Do đó khi tạo mới, luôn tự kiểm tra trước xem slug dự kiến đã bị chiếm chưa; nếu có, gắn thêm
// hậu tố theo tên category cha để phân biệt, nhưng vẫn giữ `title` sạch (không đổi tên hiển thị).
async function createCategoryWithUniqueSlug(payload, name, parentId, parentDoc) {
  let candidateSlug = slugifyText(name)
  const taken = await payload.find({
    collection: 'categories',
    where: { slug: { equals: candidateSlug } },
    limit: 1,
  })
  if (taken.docs.length) {
    const suffix = parentDoc ? slugifyText(parentDoc.title) : 'danh-muc'
    candidateSlug = `${candidateSlug}-${suffix}`
  }
  return payload.create({ collection: 'categories', data: { title: name, parent: parentId, slug: candidateSlug } })
}

// Đi từ root, mỗi bước find-or-create theo title + gán parent = id bước trước, trả về id
// của category lá cuối cùng (categories.parent do lượt trước thêm — xem Categories.ts).
async function findOrCreateCategoryPath(payload, rawNames, cache) {
  let parentId
  let parentDoc
  let leafId
  for (const rawName of rawNames || []) {
    const name = normalizeName(rawName)
    if (!name) continue
    const key = `${parentId || 'root'}::${name.toLowerCase()}`
    if (!cache.has(key)) {
      const existing = await payload.find({
        collection: 'categories',
        where: { title: { equals: name }, ...(parentId ? { parent: { equals: parentId } } : {}) },
        limit: 1,
      })
      const category = existing.docs[0] ?? (await createCategoryWithUniqueSlug(payload, name, parentId, parentDoc))
      cache.set(key, category)
    }
    parentDoc = cache.get(key)
    leafId = parentDoc.id
    parentId = leafId
  }
  return leafId ? [leafId] : []
}

async function createMediaFromFile(payload, filePath, alt) {
  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filePath).replace('.', '') || 'jpg'
  const mimetype = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  return payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: buffer,
      mimetype,
      name: path.basename(filePath),
      size: buffer.length,
    },
  })
}

async function run() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.input) throw new Error('Thiếu --input=<path/to/enriched.json>')

  const payload = await getPayload({ config: configPromise })
  const items = JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf-8'))
  const targetItems = args.limit ? items.slice(0, args.limit) : items

  const brandCache = new Map()
  const categoryCache = new Map()

  let created = 0
  let skipped = 0
  let failed = 0

  for (const [index, item] of targetItems.entries()) {
    const slug = slugifySku(item.sku)
    const label = `[${index + 1}/${targetItems.length}] ${item.sku} — ${item.title}`

    if (!slug) {
      console.warn(`${label} — bỏ qua, thiếu SKU để tạo slug`)
      failed++
      continue
    }

    try {
      const existing = await payload.find({
        collection: 'products',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (existing.docs.length) {
        console.log(`${label} — đã tồn tại (slug=${slug}), bỏ qua`)
        skipped++
        continue
      }

      const brand = await findOrCreateBrand(payload, item.brandName, brandCache)
      const categoryIds = await findOrCreateCategoryPath(payload, item.categoryPath, categoryCache)

      const gallery = []
      if (item.imagePathFromExcel && fs.existsSync(item.imagePathFromExcel)) {
        const media = await createMediaFromFile(payload, item.imagePathFromExcel, item.title)
        gallery.push({ image: media.id })
      }

      if (!gallery.length) {
        console.warn(`${label} — bỏ qua, không có ảnh nào (thiếu imagePathFromExcel)`)
        failed++
        continue
      }

      await payload.create({
        collection: 'products',
        data: {
          title: item.title,
          slug,
          generateSlug: false,
          _status: 'published',
          sku: item.sku,
          brand,
          categories: categoryIds,
          gallery,
          shortDescription: (item.shortDescription || []).map((text) => ({ text })),
          description: textToRichText(item.description || ''),
          specifications: item.specifications || [],
          priceInVNDEnabled: typeof item.priceInVND === 'number',
          priceInVND: item.priceInVND,
          inventory: item.inStock === false ? 0 : 30,
        },
      })

      console.log(`${label} — đã tạo`)
      created++
    } catch (err) {
      console.warn(`${label} — LỖI: ${err.message}`)
      if (err.data) console.warn('  DATA:', JSON.stringify(err.data))
      if (err.errors) console.warn('  ERRORS:', JSON.stringify(err.errors))
      failed++
    }
  }

  console.log(`\nTổng kết: created=${created} skipped=${skipped} failed=${failed}`)
}

await run().catch((err) => {
  console.error(err)
  process.exit(1)
})
