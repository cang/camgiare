import * as cheerio from 'cheerio'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://vuhoangtelecom.vn'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const DEFAULT_CATEGORIES = [
  'camera-ip',
  'camera-trong-nha',
  'camera-ngoai-troi',
  'camera-4g',
  'dau-ghi-hinh-camera',
]
const MAX_PAGES_PER_CATEGORY = 5
const REQUEST_DELAY_MS = 500

// Ảnh lấy từ `.woocommerce-product-gallery__wrapper` (ảnh gallery chính thức của sản
// phẩm) được giữ nguyên, không crop: phần bong bóng thông số/tên model trên ảnh là mô
// tả trực quan cho chính ảnh đó, không phải rác cần loại. Chỉ có logo nhỏ watermark
// "VU HOANG TELECOM" là không xử lý được (vị trí lệch giữa các ảnh, không patch tự
// động an toàn) — chấp nhận để nguyên. Ảnh có URL "vuhoangtelecom.vn" lớn (banner đỏ)
// không nằm trong gallery mà nằm trong nội dung mô tả nên đã không bị selector này cào.

function parseArgs(argv) {
  const args = { categories: DEFAULT_CATEGORIES, limit: 110, out: null }
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (key === 'categories' && value) args.categories = value.split(',').map((s) => s.trim())
    if (key === 'limit' && value) args.limit = parseInt(value, 10)
    if (key === 'out' && value) args.out = value
  }
  return args
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function slugFromUrl(url) {
  const match = url.match(/\/san-pham\/([^/]+)\/?$/)
  return match ? match[1] : 'san-pham'
}

async function downloadImage(url, destDir, index) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ảnh ${url}`)
  const rawBuffer = Buffer.from(await res.arrayBuffer())
  const ext = path.extname(new URL(url).pathname) || '.jpg'
  const destPath = path.join(destDir, `${index}${ext}`)
  fs.mkdirSync(destDir, { recursive: true })
  fs.writeFileSync(destPath, rawBuffer)
  return destPath
}

function parseVndNumber(text) {
  if (!text) return undefined
  const digits = text.replace(/[^\d]/g, '')
  if (!digits) return undefined
  return parseInt(digits, 10)
}

function getCategoryProductLinks($) {
  const links = new Set()
  $('a[href*="/san-pham/"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href && /\/san-pham\/[^/]+\/?$/.test(href) && href !== `${BASE}/san-pham/`) {
      links.add(href.split('?')[0])
    }
  })
  return Array.from(links)
}

function getCategoryTitle($) {
  return $('h1.az-title').first().text().trim() || null
}

function parseProductPage($, url) {
  const summary = $('.entry-summary').first()

  const title = summary.find('h1.product_title').first().text().trim()

  let sku
  let brandName
  let brandSlug
  summary.find('p.info-attribute-product').each((_, el) => {
    const node = $(el)
    const text = node.text()
    if (text.includes('Mã SP')) {
      sku = node.find('span').first().text().trim()
    }
    if (text.includes('Hãng SX')) {
      const brandLink = node.find('a[href*="/thuong-hieu/"]').first()
      if (brandLink.length) {
        brandName = brandLink.find('span').first().text().trim()
        const href = brandLink.attr('href') || ''
        const match = href.match(/\/thuong-hieu\/([^/]+)\/?/)
        brandSlug = match ? match[1] : undefined
      }
    }
  })

  const priceBlock = summary.find('.az-price').first()
  const priceText = priceBlock.find('p.price').first().clone().children().remove().end().text().trim()
  const priceInVND = priceText.toLowerCase().includes('liên hệ') ? undefined : parseVndNumber(priceText)

  let compareAtPriceInVND
  priceBlock.find('.info-price li').each((_, el) => {
    const text = $(el).text()
    if (text.includes('Giá website')) {
      compareAtPriceInVND = parseVndNumber(text)
    }
  })

  const bulletFeatures = []
  summary
    .find('.woocommerce-product-details__short-description li')
    .each((_, el) => {
      const text = $(el).text().trim()
      if (text) bulletFeatures.push(text)
    })

  const specifications = []
  $('table.product-compare tr').each((_, el) => {
    const cells = $(el).find('td')
    if (cells.length < 2) return
    if (cells.first().attr('colspan')) return
    const label = $(cells[0]).text().trim()
    const valueCell = $(cells[1]).clone()
    valueCell.find('br').replaceWith('\n')
    const value = valueCell
      .text()
      .split('\n')
      .map((part) => part.trim().replace(/^[–-]\s*/, ''))
      .filter(Boolean)
      .join('\n')
    if (label && value) specifications.push({ label, value })
  })

  const imageUrls = []
  $('.woocommerce-product-gallery__wrapper a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (href && !imageUrls.includes(href)) imageUrls.push(href)
  })

  const stockText = summary.find('.value-status').first().text().trim()

  return {
    sourceUrl: url,
    title,
    sku,
    brandName,
    brandSlug,
    priceInVND,
    compareAtPriceInVND,
    inStock: stockText ? stockText.toLowerCase().includes('còn') : true,
    bulletFeatures,
    specifications,
    imageUrls,
    imagePaths: [],
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  console.log(`Categories: ${args.categories.join(', ')} | limit=${args.limit}`)

  // url -> Set(categoryName)
  const productCategoryMap = new Map()

  for (let page = 1; page <= MAX_PAGES_PER_CATEGORY; page++) {
    for (const categorySlug of args.categories) {
      if (productCategoryMap.size >= args.limit) break

      const categoryUrl =
        page === 1 ? `${BASE}/${categorySlug}/` : `${BASE}/${categorySlug}/page/${page}/`

      let html
      try {
        html = await fetchHtml(categoryUrl)
      } catch (err) {
        console.warn(`Skip ${categoryUrl}: ${err.message}`)
        continue
      }
      await sleep(REQUEST_DELAY_MS)

      const $ = cheerio.load(html)
      const categoryName = getCategoryTitle($) || categorySlug
      const links = getCategoryProductLinks($)

      if (links.length === 0) {
        console.log(`No more products for ${categorySlug} at page ${page}`)
        continue
      }

      for (const link of links) {
        if (!productCategoryMap.has(link)) productCategoryMap.set(link, new Set())
        productCategoryMap.get(link).add(categoryName)
      }

      console.log(`${categorySlug} page ${page}: +${links.length} links (tổng unique: ${productCategoryMap.size})`)
    }
    if (productCategoryMap.size >= args.limit) break
  }

  const targetUrls = Array.from(productCategoryMap.keys()).slice(0, args.limit)
  console.log(`Sẽ cào chi tiết ${targetUrls.length} sản phẩm...`)

  const outPath = args.out
    ? path.resolve(args.out)
    : path.resolve('.claude/skills/import-vuhoang-products/tmp/scraped.json')
  const imagesRoot = path.join(path.dirname(outPath), 'images')

  const results = []
  for (const [index, url] of targetUrls.entries()) {
    try {
      const html = await fetchHtml(url)
      const $ = cheerio.load(html)
      const product = parseProductPage($, url)
      product.categoryNames = Array.from(productCategoryMap.get(url))

      const slug = slugFromUrl(url)
      const destDir = path.join(imagesRoot, slug)
      for (const [imgIndex, imageUrl] of product.imageUrls.entries()) {
        try {
          const localPath = await downloadImage(imageUrl, destDir, imgIndex)
          product.imagePaths.push(localPath)
        } catch (err) {
          console.warn(`  Lỗi tải ảnh ${imageUrl}: ${err.message}`)
        }
      }

      results.push(product)
      console.log(
        `[${index + 1}/${targetUrls.length}] OK: ${product.title} (${product.imagePaths.length} ảnh)`,
      )
    } catch (err) {
      console.warn(`[${index + 1}/${targetUrls.length}] LỖI ${url}: ${err.message}`)
    }
    await sleep(REQUEST_DELAY_MS)
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`Đã ghi ${results.length} sản phẩm ra ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
