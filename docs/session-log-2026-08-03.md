# Nhật ký phiên làm việc — 2026-08-03

Ghi lại để tiếp tục ở phiên sau mà không cần giữ context cũ. Xem thêm `docs/plan_v1.md` cho audit tổng thể so với vuhoangtelecom.vn (vẫn còn nguyên, chưa đụng tới các Nhóm 2-5 trong đó).

## 1. Dựng khung 3 trang khách hàng (trước khi nhập dữ liệu thật)

Mục tiêu: đảm bảo home/shop/product-detail đủ field + component để hiển thị đàng hoàng khi có sản phẩm thật, tránh phải sửa lại sau khi đã nhập 100+ sản phẩm.

**Schema mới:**
- Collection `Brands` (`src/collections/Brands.ts`) — name, slug, logo, description.
- `Products` (`src/collections/Products/index.ts`) thêm field: `brand` (relationship → brands), `sku`, `compareAtPriceInVND`, `specifications` (array label/value).
- Global mới `StoreInfo` (`src/globals/StoreInfo.ts`) — hotline, chính sách giao hàng/bảo hành/đổi trả ngắn, dùng cho khối sidebar trang chi tiết sản phẩm.

**Trang chi tiết sản phẩm** (`src/app/(app)/products/[slug]/page.tsx` + `src/components/product/*`):
- `Breadcrumbs` component dùng chung (`src/components/Breadcrumbs/`) kèm JSON-LD BreadcrumbList.
- Giá + badge giảm giá % (dựa `compareAtPriceInVND`), SKU, brand (logo+tên, link `/shop?brand=`), bảng thông số kỹ thuật (`SpecsTable`).
- `StockIndicator` sửa để hiện gợi ý "chọn phân loại để xem tồn kho" thay vì ẩn hẳn khi có variant chưa chọn.
- `RelatedProducts` tách riêng, có fallback tự query theo category khi không set tay.
- `StickyAddToCart`, `ShareButtons` (Facebook/Zalo/copy link), `StoreInfoSidebar` — component mới.
- JSON-LD: dùng `Offer` thường khi không có variant (trước đó luôn `AggregateOffer`).

**Trang danh sách `/shop`:**
- Phân trang thật (nối `ui/pagination.tsx` có sẵn nhưng chưa dùng trước đó), `limit=24`.
- Lọc category theo `slug` thay vì `id` (URL thân thiện hơn).
- Việt hoá label sort (`src/lib/constants.ts`).
- `ProductGridItem` sửa: bỏ kích thước ảnh cứng 80×80 (dùng `fill`), `priority` cho ảnh đầu, fallback "Liên hệ" khi không có giá, badge giảm giá.
- `shop/loading.tsx` sửa skeleton khớp layout thật.

**Trang chủ:**
- **Bug đã sửa**: `src/components/CollectionArchive/index.tsx` có phần render `<Card>` bị comment out từ template gốc → block `archive`/`carousel` không hiển thị được gì. Đã thay bằng `ProductGridItem`.
- **Bug bảo mật/nội dung đã sửa**: `ArchiveBlock`/`CarouselBlock` (`src/blocks/ArchiveBlock/Component.tsx`, `src/blocks/Carousel/Component.tsx`) thiếu `overrideAccess: false` + `draft: false` → sản phẩm chưa publish có thể lộ ra trang chủ công khai.
- Đã tạo 1 trang `home` thật (không phải test) trong Payload: hero + block `archive` (populateBy: collection, limit 12) + CTA dẫn `/shop` — tự động hiển thị sản phẩm mới khi nhập thêm, không cần sửa code.

**2 bug nghiêm trọng phát hiện ngoài phạm vi ban đầu, đã sửa vì chặn cứng mọi thứ liên quan giá/badge:**
1. `src/providers/index.tsx`: `EcommerceProvider` thiếu `currenciesConfig` → toàn bộ giá hiển thị sai thành USD/`$0.00` thay vì VND (server đã cấu hình đúng VND, nhưng client provider không nhận). Đã thêm `currenciesConfig` VND.
2. `src/app/(app)/globals.css`: `--destructive-foreground` (light mode) trùng giá trị với `--destructive` → mọi badge đỏ chữ trắng vô hình. Đã đổi thành `#ffffff`.

**Quirk môi trường dev đã gặp (đã ghi vào memory `reference_payload_run_script_quirks`):** Next.js dev server (Turbopack) có thể serve ảnh/CSS cũ dù đã sửa và server đã "Compiled" — do cache ảnh `.next/dev/cache/images` không tự xoá khi restart thường, phải xoá thư mục này tay hoặc chấp nhận đó chỉ là hiện tượng lazy-load/tạm thời (đã xác minh nhiều lần trong phiên này bằng cách fetch trực tiếp ảnh qua API, không qua Next Image, để phân biệt "thật sự lỗi" và "cache/lazy-load").

## 2. Skill nhập sản phẩm từ vuhoangtelecom.vn

**Vị trí:** `.claude/skills/import-vuhoang-products/` — có `SKILL.md` (hướng dẫn dùng lại), `scripts/scrape.mjs`, `scripts/import.mjs`.

**Cách hoạt động:**
1. `scrape.mjs` — cào category listing (`camera-ip`, `camera-trong-nha`, `camera-ngoai-troi`, `camera-4g`, `dau-ghi-hinh-camera` mặc định) → lấy URL sản phẩm, dedupe → cào từng trang chi tiết (title/sku/brand/giá/giảm giá/bullet/specs/ảnh) bằng `cheerio`. **Tự crop ảnh** (bỏ dải logo/tiêu đề + cột bong bóng marketing của vuhoangtelecom, theo tỉ lệ cố định đã đo tay trên 7 ảnh mẫu — xem comment trong file) rồi lưu về `tmp/images/`.
2. Viết lại mô tả (paraphrase, không copy nguyên văn) — bước này do agent tự làm khi chạy skill, ghi ra `tmp/enriched.json`.
3. `import.mjs` (chạy qua `npm run payload -- run ...`) — find-or-create Brand/Category theo tên (so khớp **không phân biệt hoa/thường** để tránh trùng slug), upload ảnh local thành Media, tạo Product. **Idempotent theo slug** — chạy lại an toàn, không tạo trùng.

**Đã cào & nhập xong 117 sản phẩm** (116 mới + 1 sản phẩm test cũ) — 6 brand (TP-LINK, EZVIZ, HIKVISION, DAHUA, IMOU, KBVision), 6 category (Camera IP, Camera 4G, Camera trong nhà, Camera ngoài trời, Đầu ghi camera, Đầu ghi hình IP).

**Vấn đề đã gặp & sửa trong lúc chạy full batch:**
- Bug case-sensitive khi so brand (đã có brand "KBVision" tạo tay từ trước, scraper lấy "KBVISION" viết hoa từ nguồn → tạo brand mới bị trùng slug do Payload tự slugify về cùng "kbvision") — đã sửa `findOrCreateBrand`/`findOrCreateCategories` so khớp không phân biệt hoa/thường.
- Phát hiện **chính vuhoangtelecom.vn gắn sai brand** cho sản phẩm KBVISION KX-C52D (hiện brand DAHUA trên trang của họ) — đã sửa lại đúng lúc nhập.

**Giới hạn đã biết, chấp nhận cho lượt này (đã hỏi ý kiến và được xác nhận):**
- Ảnh vẫn còn watermark nhỏ "VU HOANG TELECOM" ở một vị trí trong ảnh (không có công cụ AI xoá vật thể/inpainting để xử lý an toàn tự động — vị trí watermark lệch nhiều giữa các ảnh nên patch tự động rủi ro cắt vào sản phẩm). Khi làm thật sẽ cần thay ảnh gốc từ hãng hoặc chụp riêng.
- 2 category tên hơi chồng nhau ý nghĩa ("Đầu ghi camera" mới cào vs "Đầu ghi hình IP" tạo tay từ trước) — có thể gộp tay qua `/admin` nếu muốn.

## 3. Việc chưa làm / gợi ý bước tiếp theo (phần này viết ở phiên trước, xem phần 4-5 bên dưới cho phiên sau)

- Bộ lọc giá/hãng/độ phân giải kiểu trang danh mục của vuhoangtelecom (đã note là làm SAU khi có data — giờ đã có 117 sản phẩm, có thể làm được rồi).
- Nhóm 2-5 trong `docs/plan_v1.md` (mega-menu, blog, testimonial, review/rating...) — chưa động tới.
- Nếu muốn nhập thêm sản phẩm/category khác: chạy lại đúng theo hướng dẫn trong `.claude/skills/import-vuhoang-products/SKILL.md`.
- Ảnh sản phẩm còn watermark — cân nhắc thay dần bằng ảnh gốc từ hãng khi có.

## 4. Phiên tiếp theo (cùng ngày) — sửa trang chi tiết sản phẩm theo yêu cầu review UI

So sánh `https://vuhoangtelecom.vn/san-pham/...` với trang local, user yêu cầu: có tóm tắt bullet
ngắn, specs giữ format gạch đầu dòng (không phá thành 1 câu dài), thêm "Thông tin hãng sản xuất".
Mô tả dài dạng rich-content (ảnh/video) bị loại khỏi scope vì quá phức tạp — quyết định giữ
nguyên `description` đơn giản như cũ, không xây thêm section riêng cho nó. Không backfill lại 117
sản phẩm cũ — chỉ áp dụng cho sản phẩm import mới.

**Schema (`src/collections/Products/index.ts`):**
- Field mới `shortDescription` (array `{text}`) — lưu bullet tóm tắt.
- `specifications.value` đổi từ `text` → `textarea` (cho phép nhiều dòng/bullet trong 1 spec).

**Scraper/import fix — nguyên nhân gốc của "specs bị phá format":**
- `scrape.mjs`: trước đây thay `<br>` bằng `"; "` rồi nối phẳng thành 1 chuỗi → đã sửa thành thay
  `<br>` bằng `\n`, giữ xuống dòng thật.
- `import.mjs`: thêm `shortDescription: bulletFeatures.map(text => ({text}))`; giữ nguyên logic
  `description` cũ (fallback từ bulletFeatures nếu không có mô tả dài — vẫn chưa có nguồn mô tả
  dài thật nào được cào).
- **Quan trọng — bug ảnh bị cắt đã phát hiện & sửa TRONG lúc làm việc này**: `scrape.mjs` bản cũ
  dùng `sharp` để tự crop ảnh tải về theo tỉ lệ cố định (`CROP_TOP_RATIO`/`CROP_LEFT_RATIO`, xem
  mục 2 ở trên). Trong lúc phiên này đang chạy, code đã được sửa (không rõ do user hay linter) để
  **bỏ hẳn việc crop** — ảnh giờ lưu nguyên bản gốc (đã xác minh: ảnh cũ 547×573 bị crop méo, ảnh
  mới 1000×1000 vuông nguyên vẹn). Điều này có nghĩa **6 sản phẩm demo tạo sớm trong phiên** (SKU
  KX-AD2003N-A, KX-AD2112CN-A, KX-AD2111CN-A, DH-SDT2A200-2F-NB-A-PV, DH-IPC-PT1239H-PV,
  DH-IPC-HFW1230TL2-A) **vẫn đang dùng ảnh bị cắt cũ** — user đã được hỏi có muốn xoá không và
  **chọn KHÔNG xoá**, chấp nhận giữ vậy. 4 sản phẩm demo tạo sau (HIKVISION DS-2CD1T67G2HP-LIUF/SRB,
  DAHUA DH-IPC-HDBW2449F-AS-IL, IMOU IPC-K7FP-8V0N, HIKVISION DS-2CD1347G3H-LIUF/SRB) dùng ảnh
  không bị cắt, đúng bản scraper mới.

**UI (`src/components/product/*`, `src/app/(app)/products/[slug]/page.tsx`):**
- `SpecsTable.tsx` — render `<ul>` bullet khi 1 spec có nhiều dòng, giữ text thường khi 1 dòng.
- `ProductDescription.tsx` — thêm bullet tóm tắt ngay dưới giá; bỏ `SpecsTable` ra khỏi sidebar
  (chuyển xuống section full-width); giữ nguyên render `description`.
- `BrandInfo.tsx` (mới) — section "Thông tin hãng sản xuất" (logo, tên, mô tả, link lọc theo hãng).
- `page.tsx` — thêm section full-width sau buybox: `SpecsTable` → `BrandInfo`, trước
  `RenderBlocks`/`RelatedProducts`.

**Các bug UI khác phát hiện & sửa trong lúc user test trực tiếp:**
- **Ảnh trống ở "Sản phẩm liên quan"/Carousel trang chủ/ThreeItemGrid**: cả 3 nơi lấy ảnh từ
  `meta.image` (field ảnh SEO, thường trống) thay vì `gallery[0].image` — đã sửa cả 3
  (`RelatedProducts.tsx`, `Carousel/Component.client.tsx`, `ThreeItemGrid/Component.tsx`), và sửa
  type `media` trong `Grid/tile.tsx` (`GridTileImage`) từ bắt buộc thành optional cho đúng.
- **"Sản phẩm liên quan" dùng thanh scroll ngang xấu**: thử grid tĩnh trước, nhưng user phản hồi
  không kéo được qua sản phẩm thứ 6+ → đổi hẳn sang `Carousel` (embla, component có sẵn ở
  `src/components/ui/carousel.tsx`) có nút mũi tên, nâng limit query fallback theo category từ 5
  lên 10 (`RelatedProducts.tsx`).
- **StickyAddToCart đè lên Footer**: thanh sticky "thêm giỏ hàng" dùng `position:fixed` đúng kỹ
  thuật nhưng không tự ẩn khi cuộn tới cuối trang, che mất dòng bản quyền trong Footer. Đã thêm
  `id="site-footer"` (`src/components/Footer/index.tsx`) và observer thứ 2 trong
  `StickyAddToCart.tsx` — chỉ hiện khi buybox đã cuộn qua NHƯNG footer chưa xuất hiện.
- **Gallery ảnh chính quá to**: giới hạn `max-w-md`, thêm click-to-zoom (Dialog phóng to), và
  thêm điều hướng bằng phím mũi tên trái/phải (chuyển ảnh + tự cuộn thumbnail) — `Gallery.tsx`.

**Verify đã làm**: `npm run generate:types` + `tsc --noEmit` sạch (chỉ còn lỗi cũ không liên quan
ở `CartModal.tsx`/`CheckoutPage.tsx` — implicit any, có từ trước, chưa sửa). `npm run lint` KHÔNG
chạy được — lỗi cấu hình ESLint 9 (circular JSON trong config), có từ trước, không liên quan tới
thay đổi phiên này, chưa sửa. Mọi fix UI đều verify bằng Playwright chạy thật trên dev server
(channel: 'chrome') thay vì chỉ đọc code — xem lại phần "Playwright verify-ui workaround" trong
memory.

**Việc còn để dành (Phase 2, user đồng ý làm sau, chưa code):**
- "Sản phẩm bạn đã xem" (recently viewed) — cần localStorage tracking, chưa có cơ chế nào trong
  repo (chỉ có `ThemeProvider` dùng localStorage làm ví dụ pattern).
- "Đánh giá sản phẩm" (reviews) — cần collection `Reviews` mới (plain `CollectionConfig`, đăng ký
  thẳng vào `payload.config.ts` theo pattern `Categories.ts`, không qua ecommerce plugin), field
  `product`/`customer` (relationTo `users`, vì ecommerce plugin cấu hình `customers: {slug:
  'users'}`)/`rating`/`comment`, access dùng lại `adminOrPublishedStatus` + `isDocumentOwner`.

## 5. Chức năng tìm kiếm (cùng ngày, sau phần 4)

User muốn thêm ô tìm kiếm — trước đó site **hoàn toàn chưa có UI tìm kiếm nào**, dù `/shop` đã
có sẵn backend xử lý `?q=` (chỉ match `title`/`description`, không match `sku`) — chỉ dùng được
nếu tự gõ URL tay.

**Quyết định phạm vi**: làm nhanh phần cơ bản trước (thêm `sku` vào query có sẵn + UI ô tìm kiếm +
autocomplete — **autocomplete được yêu cầu là bắt buộc**), còn tìm kiếm full-text sâu theo nội
dung/tính năng (vd gõ "camera có màu ban đêm" mà không cần biết tên sản phẩm) để làm sau bằng
`@payloadcms/plugin-search` (bản `3.87.0`, khớp version `payload` đang ghim) — **chưa cài, chưa
code phần này**, chỉ mới lên plan chi tiết (đã lưu ở
`C:\Users\cangd\.claude\plans\tingly-hopping-minsky.md`, file này nằm ngoài repo nên có thể mất —
tóm tắt hướng đi bên dưới để không phụ thuộc file đó).

**Đã làm (trong repo, đã verify):**
- `src/app/(app)/shop/page.tsx` — thêm `sku` vào mảng `or` của where-clause search (cùng
  `title`/`description`).
- `src/components/layout/search/SearchBar.tsx` (mới) — input + nút tìm, submit sang
  `/shop?q=...`. Kèm **autocomplete**: debounce 250ms, gọi thẳng REST API
  `/api/products?where=...&select=...` (query `title`/`sku` LIKE, `_status: published`), hiện
  dropdown tối đa 8 gợi ý (tên + giá qua component `Price` có sẵn), click hoặc phím ↑/↓ + Enter để
  chọn thẳng tới `/products/[slug]`, đóng khi click ra ngoài hoặc Esc.
- Gắn `SearchBar` vào `src/components/Header/index.client.tsx` (khoảng trống giữa logo/nav và giỏ
  hàng, chỉ hiện `md:` trở lên) và `src/components/Header/MobileMenu.tsx` (đầu nội dung menu).

**Hướng đi đã lên plan cho full-text search (làm sau, CHƯA code):**
1. Cài `@payloadcms/plugin-search@3.87.0`, đăng ký trong `src/plugins/index.ts` (theo style các
   plugin khác — factory gọi inline trong mảng `plugins`), scope `collections: ['products']` (không
   index `services`), `syncDrafts: false`, `searchOverrides.fields` thêm `sku`/`brand` (text),
   `searchOverrides.access` dùng `publicAccess`/`adminOnly`, `beforeSync` copy `sku` + tên brand từ
   `originalDoc` vào search doc.
2. Sửa `/shop/page.tsx`: khi có `q`, tra cứu 2 tầng qua collection `search` mới (SKU match trước,
   title/brand match sau, loại trùng), lấy danh sách ID sản phẩm theo đúng thứ tự ưu tiên, rồi
   query `products` bằng `where: {id: {in: ids}}` và sắp lại `docs` theo đúng thứ tự đó bằng JS
   (Payload không đảm bảo thứ tự khi dùng `in`).
3. Không tạo trang `/search` riêng — tất cả vẫn đổ về `/shop?q=` để tái dùng UI grid/pagination/sort
   đã có, tránh 2 luồng tìm kiếm song song.
4. Giới hạn đã biết: không có fuzzy-match/sửa lỗi chính tả (chỉ substring match qua Mongo `like`).

**Verify đã làm cho phần search**: `tsc --noEmit` sạch; Playwright xác nhận: search bar hiện trên
trang chủ, gõ SKU chuyển đúng sang `/shop?q=SKU` ra đúng sản phẩm dù SKU không nằm trong title,
autocomplete hiện đúng gợi ý kèm giá, phím ↑/↓ đổi highlight đúng và Enter điều hướng đúng sản
phẩm đang highlight.

## 6. Phase 2 trang chi tiết sản phẩm: Sản phẩm mua kèm / Sản phẩm bạn đã xem / Đánh giá sản phẩm

Làm nốt 2 việc còn treo ở mục 4 ("Sản phẩm bạn đã xem", "Đánh giá sản phẩm") + 1 việc mới phát
sinh trong phiên này ("Sản phẩm mua kèm"), theo tham khảo layout của
`vuhoangtelecom.vn/san-pham/camera-wifi-pt-cruiser-sc-8mp-imou-ipc-k7fp-8v0n/`. Thứ tự hiển thị
trên trang theo yêu cầu: buybox → **Sản phẩm mua kèm** → `RenderBlocks` (layout blocks) →
**Sản phẩm liên quan** → **Sản phẩm bạn đã xem** → **Đánh giá về sản phẩm**.

**Sản phẩm mua kèm — quyết định nguyên tắc quan trọng:** ban đầu định làm field quan hệ
`bundleProducts` để admin tự chọn tay (giống `relatedProducts`), nhưng **user yêu cầu đổi sang cơ
chế tự động theo nhóm danh mục** (cùng nguyên tắc category-based như "Sản phẩm liên quan", không
phải chọn tay). Cách làm:
- Thêm field `isAccessory` (checkbox) vào `Categories` (`src/collections/Categories.ts`) — đánh
  dấu danh mục nào là "danh mục phụ kiện" (thẻ nhớ, nguồn, dây cáp...).
- `src/components/product/BundleProducts.tsx` (server): nếu sản phẩm đang xem **thuộc chính** một
  category được đánh dấu `isAccessory` thì ẩn hẳn section (phụ kiện không tự gợi ý phụ kiện khác).
  Ngược lại, query tối đa 4 sản phẩm published thuộc (các) category có `isAccessory=true`, khác
  category của sản phẩm đang xem, loại trừ chính nó.
- `BundleProducts.client.tsx`: liệt kê sản phẩm chính (khoá, luôn tick) + các gợi ý (checkbox chọn/
  bỏ), tính tổng tiền theo lựa chọn, nút "Thêm tất cả vào giỏ" gọi `addItem` tuần tự qua `useCart()`.
- **Cần làm để thấy section này lên trang**: vào admin → Categories → tick "Danh mục phụ kiện" cho
  category phụ kiện thật (hiện DB seed/import chưa có category nào được đánh dấu, nên section này
  đang ẩn ở mọi sản phẩm cho tới khi admin gắn cờ).

**Sản phẩm bạn đã xem** (`src/components/product/RecentlyViewed.tsx`, client component):
- Lưu danh sách slug đã xem vào `localStorage` (key `recentlyViewedProducts`, tối đa 12), tự thêm
  slug hiện tại lên đầu khi mount.
- Fetch các sản phẩm khác qua REST API sẵn có `/api/products?where=...` (cùng pattern
  `JSON.stringify(where)` như `SearchBar.tsx`), không cần route/API riêng.
- Ẩn hẳn section nếu chưa xem sản phẩm nào khác (không có layout-shift giả).

**Đánh giá sản phẩm** — collection mới `src/collections/Reviews.ts` (plain `CollectionConfig`,
đăng ký thẳng trong `payload.config.ts`, không qua ecommerce plugin):
- Field: `product` (relationship → products, required), `rating` (number 1-5), `authorName`,
  `authorEmail`, `comment`, `customer` (relationship → users, tự gán qua hook `beforeChange` từ
  `req.user` nếu đang đăng nhập, không cho client tự set), `status` (select
  `pending`/`approved`, mặc định `pending`, field-access `adminOnlyFieldAccess` cho create/update —
  chặn khách tự gửi thẳng `approved`).
- Access: `create: publicAccess` (ai cũng gửi được), `read` công khai chỉ thấy `status: approved`
  (admin thấy hết), `update`/`delete`: `adminOnly`.
- Duyệt review: **không cần code thêm** — dùng bulk-edit có sẵn của Payload admin (tick nhiều dòng
  ở list Reviews → nút "Edit" → set `status = approved` hàng loạt).
- UI: `StarRating.tsx` (hiển thị sao, dùng chung cho list + trung bình), `ReviewForm.tsx` (client,
  react-hook-form, POST thẳng `/api/reviews`, tự điền tên/email nếu đã đăng nhập qua `useAuth()`),
  `Reviews.tsx` (server, query review `approved` theo `product`, tính điểm trung bình từ tập đã
  fetch — giới hạn 50 review/trang, chưa phân trang riêng).

**Verify đã làm**: `npm run generate:types` chạy sạch (sinh đúng `Review` interface +
`isAccessory`); `tsc --noEmit` sạch trên toàn bộ file mới/sửa (6 lỗi implicit-any còn lại ở
`CartModal.tsx`/`CheckoutPage.tsx` là lỗi cũ, không liên quan, đã xác nhận lại lần nữa). `npm run
lint` vẫn lỗi cấu hình ESLint có sẵn từ trước (circular JSON, xảy ra trước khi lint file nào) —
chưa sửa, ngoài phạm vi phiên này. Đã verify runtime thật qua dev server đang chạy sẵn lúc đó
(không phải Playwright lần này): `curl /api/reviews` trả đúng 1 review có sẵn trong DB (do user tự
tay gửi + duyệt qua UI thật trong lúc code đang được viết) với `status: approved`, và HTML trang
sản phẩm render đúng "5.0/5 · 1 đánh giá" + nội dung review + form gửi đánh giá mới. "Sản phẩm mua
kèm" xác nhận **đúng như thiết kế** không hiện (chưa có category nào gắn `isAccessory`), "Sản phẩm
bạn đã xem" không kiểm được qua curl (cần localStorage/browser thật).

**Việc còn để dành / chưa làm:**
- Chưa có category nào được gắn `isAccessory=true` trong DB thật — cần vào admin gắn tay thì
  "Sản phẩm mua kèm" mới xuất hiện trên site.
- Trung bình sao của `Reviews.tsx` tính trên tối đa 50 review gần nhất (không phải toàn bộ nếu
  sản phẩm có >50 review), chưa có phân trang review riêng — chấp nhận được ở quy mô hiện tại.
- Chưa test luồng thật qua Playwright cho phiên này (chỉ verify qua curl + HTML thật từ dev server
  đang chạy sẵn) — nếu cần verify UI kỹ hơn (form validate, toast, checkbox mua kèm) thì nên chạy
  Playwright ở phiên sau.
