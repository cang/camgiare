import * as cheerio from 'cheerio'
import fs from 'node:fs'
import path from 'node:path'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const REQUEST_DELAY_MS = 400
const DEFAULT_BRAND = 'HIKFIRE'
const DEFAULT_CATEGORY_ROOT = ['Thiết bị báo động - báo cháy', 'Thiết bị báo cháy']

function parseArgs(argv) {
  const args = { input: null, out: null, limit: undefined }
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (key === 'input' && value) args.input = value
    if (key === 'out' && value) args.out = value
    if (key === 'limit' && value) args.limit = parseInt(value, 10)
  }
  return args
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseVndNumber(text) {
  if (!text) return undefined
  const digits = String(text).replace(/[^\d]/g, '')
  if (!digits) return undefined
  return parseInt(digits, 10)
}

// So khớp SKU chính xác bằng cách tách "token" giống-SKU (chữ/số nối bằng - hoặc /) trong
// văn bản, rồi so bằng tuyệt đối — tránh lỗi khớp nhầm theo substring (VD "HF-S3E" nằm
// trong "HF-S3E-R" nhưng là 2 sản phẩm khác nhau).
function extractSkuTokens(text) {
  return (text || '').toUpperCase().match(/[A-Z0-9]+(?:[-/][A-Z0-9]+)*/g) || []
}

function isExactSkuMatch(text, sku) {
  const target = (sku || '').trim().toUpperCase()
  if (!target) return false
  return extractSkuTokens(text).includes(target)
}

async function fetchText(url, opts = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', ...opts })
  return { res, html: await res.text() }
}

// Chuẩn hoá NFC — HTML cào về có thể chứa chuỗi tiếng Việt ở dạng NFD (dấu tách rời),
// nhìn giống nhau nhưng khác byte so với chuỗi tự gõ, dễ gây lỗi so khớp "equals" âm thầm
// ở bước import (đã gặp thật: tạo trùng category "Camera báo cháy Fusion").
function textOf($el) {
  return $el.text().normalize('NFC').replace(/\s+/g, ' ').trim()
}

function specTableFromPairs($, rows, labelSel, valueSel) {
  const specifications = []
  rows.each((_, el) => {
    const label = textOf($(el).find(labelSel).first())
    const value = textOf($(el).find(valueSel).first())
    if (label && value) specifications.push({ label, value })
  })
  return specifications
}

// ----- Adapter chung cho site WooCommerce (vuhoangtelecom.vn, nhaantoan.com): GET ?s= tự
// redirect sang trang sản phẩm khi có (đúng hoặc gần đúng) 1 kết quả. Chỉ tìm ứng viên —
// việc xác minh SKU chính xác do từng site tự làm (mỗi theme render field SKU khác nhau).
async function findWooCommerceCandidates(baseUrl, sku) {
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(sku)}&post_type=product`
  const { res, html } = await fetchText(searchUrl)
  const finalUrl = res.url

  // 1 kết quả -> WordPress tự redirect ra khỏi URL search (không còn "?s=" nữa), bất kể
  // slug 1 cấp (vuhoangtelecom.vn: /san-pham/{slug}/) hay lồng nhiều cấp + đuôi .html
  // (nhaantoan.com: /san-pham/{cat}/{cat2}/{slug}.html) — không đoán theo hình dạng URL.
  const candidateUrls = new Set()
  if (!finalUrl.includes('?s=')) {
    candidateUrls.add(finalUrl)
  } else {
    const $ = cheerio.load(html)
    $('a[href*="/san-pham/"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && /\/san-pham\/.+/.test(href)) candidateUrls.add(href.split('?')[0])
    })
  }

  const candidates = []
  for (const url of Array.from(candidateUrls).slice(0, 5)) {
    if (url === finalUrl) {
      candidates.push({ $: cheerio.load(html), productUrl: url })
      continue
    }
    await sleep(REQUEST_DELAY_MS)
    const fetched = await fetchText(url)
    candidates.push({ $: cheerio.load(fetched.html), productUrl: fetched.res.url })
  }
  return candidates
}

function breadcrumbTexts($, selector) {
  const texts = []
  $(selector).each((_, el) => {
    const t = textOf($(el))
    if (t) texts.push(t)
  })
  return texts
}

async function matchVuHoangTelecom(sku) {
  const BASE = 'https://vuhoangtelecom.vn'
  const candidates = await findWooCommerceCandidates(BASE, sku)

  let found
  for (const candidate of candidates) {
    const declaredSku = candidate.$('.entry-summary p.info-attribute-product')
      .filter((_, el) => candidate.$(el).text().includes('Mã SP'))
      .find('span')
      .first()
      .text()
      .trim()
    if (isExactSkuMatch(declaredSku, sku)) {
      found = candidate
      break
    }
  }
  if (!found) return { matched: false, site: 'vuhoangtelecom.vn' }
  const { $, productUrl } = found

  const summary = $('.entry-summary').first()
  const title = summary.find('h1.product_title').first().text().trim()

  let brandName
  summary.find('p.info-attribute-product').each((_, el) => {
    const node = $(el)
    if (node.text().includes('Hãng SX')) {
      brandName = node.find('a[href*="/thuong-hieu/"] span').first().text().trim() || undefined
    }
  })

  const priceBlock = summary.find('.az-price').first()
  const priceText = priceBlock.find('p.price').first().clone().children().remove().end().text().trim()
  const priceInVND = priceText.toLowerCase().includes('liên hệ') ? undefined : parseVndNumber(priceText)

  const shortDescriptionBullets = []
  summary.find('.woocommerce-product-details__short-description li').each((_, el) => {
    const t = textOf($(el))
    if (t) shortDescriptionBullets.push(t)
  })

  const specifications = specTableFromPairs(
    $,
    $('table.product-compare tr').filter((_, el) => $(el).find('td').length >= 2 && !$(el).find('td').first().attr('colspan')),
    'td:nth-child(1)',
    'td:nth-child(2)',
  )

  const stockText = summary.find('.value-status').first().text().trim()

  // Breadcrumb thật: Trang chủ » Sản phẩm » <...category path...> » <Brand> » (tên SP, không phải link)
  const crumbs = breadcrumbTexts($, '.woocommerce-breadcrumb a')
  const categoryPath = crumbs.slice(2).filter((c) => c.toLowerCase() !== (brandName || DEFAULT_BRAND).toLowerCase())

  return {
    matched: true,
    site: 'vuhoangtelecom.vn',
    sourceUrl: productUrl,
    title,
    brandName,
    categoryPath,
    shortDescriptionBullets,
    specifications,
    descriptionText: '',
    priceInVND,
    inStock: stockText ? stockText.toLowerCase().includes('còn') : undefined,
  }
}

async function matchNhaAnToan(sku) {
  const BASE = 'https://nhaantoan.com'
  const candidates = await findWooCommerceCandidates(BASE, sku)

  let found
  for (const candidate of candidates) {
    const declaredSku = candidate.$('.sku_wrapper .sku').first().text().trim()
    if (isExactSkuMatch(declaredSku, sku)) {
      found = candidate
      break
    }
  }
  if (!found) return { matched: false, site: 'nhaantoan.com' }
  const { $, productUrl } = found

  const title = $('h1.product_title').first().text().trim()

  let brandName
  $('.product_meta .posted_in a[href*="/thuong-hieu/"]').each((_, el) => {
    brandName = $(el).text().trim() || brandName
  })

  const priceText = $('.price-wrapper .price').first().text().trim()
  const priceInVND = priceText.toLowerCase().includes('liên hệ') ? undefined : parseVndNumber(priceText)

  const specifications = specTableFromPairs($, $('.product-short-description table tbody tr'), 'td:nth-child(1)', 'td:nth-child(2)')

  const descriptionText = textOf($('.woocommerce-Tabs-panel--description').first())

  const crumbs = breadcrumbTexts($, '.woocommerce-breadcrumb a')
  const categoryPath = crumbs.slice(1) // bỏ "Trang chủ"; site này không lồng brand vào breadcrumb

  return {
    matched: true,
    site: 'nhaantoan.com',
    sourceUrl: productUrl,
    title,
    brandName,
    categoryPath,
    shortDescriptionBullets: [],
    specifications,
    descriptionText,
    priceInVND,
    inStock: undefined,
  }
}

async function matchSieuThiVienThong(sku) {
  const BASE = 'https://www.sieuthivienthong.com'
  const { html } = await fetchText(`${BASE}/searchresult.html`, {
    method: 'POST',
    body: new URLSearchParams({ seracharg: sku }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const $list = cheerio.load(html)

  const candidates = []
  $list('.item-prdt a.name[href]').each((_, el) => {
    const href = $list(el).attr('href')
    const titleAttr = $list(el).attr('title') || $list(el).text()
    if (href && isExactSkuMatch(titleAttr, sku)) {
      candidates.push(href.startsWith('http') ? href : `${BASE}${href}`)
    }
  })

  if (!candidates.length) return { matched: false, site: 'sieuthivienthong.com' }

  await sleep(REQUEST_DELAY_MS)
  const { html: productHtml, res } = await fetchText(candidates[0])
  const $ = cheerio.load(productHtml)

  const title = $('.info-detail h1.name').first().text().trim()
  if (!isExactSkuMatch(title, sku)) return { matched: false, site: 'sieuthivienthong.com' }

  let brandName
  $('.info-detail .code').each((_, el) => {
    const t = $(el).text()
    if (t.includes('Hãng SX')) brandName = t.replace(/.*Hãng SX:/, '').trim() || undefined
  })

  const priceText = $('.info-detail .price strong').first().text().trim()
  const priceInVND = parseVndNumber(priceText)

  const shortDescriptionBullets = $('.info-detail .sdesc')
    .first()
    .html()
    ?.split(/<br\s*\/?>/i)
    .map((line) => line.replace(/<[^>]+>/g, '').replace(/^[-•\s]+/, '').trim())
    .filter(Boolean) || []

  const specifications = []
  $('.tbl-specifications .row-speci').each((_, el) => {
    const label = textOf($(el).find('.lbl').first())
    const value = textOf($(el).find('.content').first())
    if (label && value) specifications.push({ label, value })
  })

  const descriptionText = textOf($('#tab-ct1 .content').first())

  const crumbItems = []
  $('.breadcrumb .breadcrumb-item a').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (href.includes('/home.html')) return
    crumbItems.push(textOf($(el)))
  })
  crumbItems.pop() // phần tử cuối là chính tên sản phẩm (breadcrumb-item active), không phải category
  const categoryPath = crumbItems

  return {
    matched: true,
    site: 'sieuthivienthong.com',
    sourceUrl: res.url,
    title,
    brandName,
    categoryPath,
    shortDescriptionBullets,
    specifications,
    descriptionText,
    priceInVND,
    inStock: undefined,
  }
}

function pickCategoryPath(matches) {
  for (const site of ['vuhoangtelecom.vn', 'nhaantoan.com', 'sieuthivienthong.com']) {
    const match = matches.find((m) => m.site === site && m.matched && m.categoryPath?.length)
    if (match) return [...DEFAULT_CATEGORY_ROOT, match.categoryPath[match.categoryPath.length - 1]]
  }
  return DEFAULT_CATEGORY_ROOT
}

function pickBrandName(matches) {
  const withBrand = matches.find((m) => m.matched && m.brandName)
  return withBrand?.brandName || DEFAULT_BRAND
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.input) throw new Error('Thiếu --input=<path/to/input.json>')

  const inputItems = JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf-8'))
  const targetItems = args.limit ? inputItems.slice(0, args.limit) : inputItems

  const results = []
  for (const [index, item] of targetItems.entries()) {
    const label = `[${index + 1}/${targetItems.length}] ${item.sku}`
    const matches = []
    for (const matcher of [matchVuHoangTelecom, matchNhaAnToan, matchSieuThiVienThong]) {
      try {
        matches.push(await matcher(item.sku))
      } catch (err) {
        console.warn(`${label} — lỗi khi tra ${matcher.name}: ${err.message}`)
        matches.push({ matched: false, site: matcher.name })
      }
      await sleep(REQUEST_DELAY_MS)
    }

    const matchedSites = matches.filter((m) => m.matched)
    console.log(`${label} — khớp ${matchedSites.length}/3 site (${matchedSites.map((m) => m.site).join(', ') || 'không site nào'})`)

    results.push({
      sku: item.sku,
      matches,
      categoryPath: pickCategoryPath(matches),
      brandName: pickBrandName(matches),
    })
  }

  const outPath = args.out
    ? path.resolve(args.out)
    : path.resolve('.claude/skills/import-products-by-sku/tmp/scraped.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8')

  const zeroMatch = results.filter((r) => !r.matches.some((m) => m.matched)).map((r) => r.sku)
  console.log(`\nĐã ghi ${results.length} sản phẩm -> ${outPath}`)
  if (zeroMatch.length) console.log(`SKU không khớp site nào (cần agent tự WebSearch ở Bước 2): ${zeroMatch.join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
