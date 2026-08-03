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

function slugFromUrl(url) {
  const match = url.match(/\/san-pham\/([^/]+)\/?$/)
  return match ? match[1] : undefined
}

async function findOrCreateBrand(payload, name, cache) {
  if (!name) return undefined
  const key = name.toLowerCase()
  if (cache.has(key)) return cache.get(key)

  // So khớp không phân biệt hoa/thường để tránh tạo trùng slug (Payload slugify
  // "KBVISION" và "KBVision" ra cùng 1 slug "kbvision" -> lỗi unique nếu tạo mới).
  const existing = await payload.find({ collection: 'brands', limit: 200 })
  const match = existing.docs.find((doc) => doc.name.toLowerCase() === key)

  const brand = match ?? (await payload.create({ collection: 'brands', data: { name } }))
  cache.set(key, brand)
  return brand
}

async function findOrCreateCategories(payload, names, cache) {
  const ids = []
  for (const name of names || []) {
    if (!name) continue
    const key = name.toLowerCase()
    if (!cache.has(key)) {
      const existing = await payload.find({ collection: 'categories', limit: 200 })
      const match = existing.docs.find((doc) => doc.title.toLowerCase() === key)
      const category = match ?? (await payload.create({ collection: 'categories', data: { title: name } }))
      cache.set(key, category)
    }
    ids.push(cache.get(key).id)
  }
  return ids
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
    const slug = slugFromUrl(item.sourceUrl)
    const label = `[${index + 1}/${targetItems.length}] ${item.title}`

    if (!slug) {
      console.warn(`${label} — bỏ qua, không lấy được slug từ sourceUrl`)
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
      const categoryIds = await findOrCreateCategories(payload, item.categoryNames, categoryCache)

      const gallery = []
      for (const [imgIndex, imagePath] of (item.imagePaths || []).entries()) {
        if (!fs.existsSync(imagePath)) continue
        const media = await createMediaFromFile(
          payload,
          imagePath,
          `${item.title} - ảnh ${imgIndex + 1}`,
        )
        gallery.push({ image: media.id })
      }

      if (!gallery.length) {
        console.warn(`${label} — bỏ qua, không có ảnh nào tải được`)
        failed++
        continue
      }

      const hasValidDiscount =
        typeof item.compareAtPriceInVND === 'number' &&
        typeof item.priceInVND === 'number' &&
        item.compareAtPriceInVND > item.priceInVND

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
          shortDescription: (item.bulletFeatures || []).map((text) => ({ text })),
          description: textToRichText((item.description || item.bulletFeatures?.join('. ')) ?? ''),
          specifications: item.specifications || [],
          priceInVNDEnabled: typeof item.priceInVND === 'number',
          priceInVND: item.priceInVND,
          compareAtPriceInVND: hasValidDiscount ? item.compareAtPriceInVND : undefined,
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
