import fs from 'node:fs'
import path from 'node:path'

const FILE = path.resolve('.claude/skills/import-products-by-sku/tmp/enriched-by-sheet/cam1-ipc.json')
const SKU = 'DS-2CD1067G2H-LIU'
const FIXED_PATH = '.claude/skills/import-products-by-sku/tmp/images/ds-2cd1067g2h-liu.jpeg'

const items = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
const item = items.find((i) => i.sku === SKU)
item.imagePathFromExcel = FIXED_PATH
fs.writeFileSync(FILE, JSON.stringify(items, null, 2), 'utf-8')
console.log('fixed path:', item.imagePathFromExcel, 'exists:', fs.existsSync(path.resolve(FIXED_PATH)))
