import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 })
await page.screenshot({ path: 'homepage-full.png', fullPage: false })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.screenshot({ path: 'homepage-top.png', fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 400 } })
console.log('screenshots saved')
await browser.close()
