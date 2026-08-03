# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tổng quan project

Website bán camera quan sát và dịch vụ lắp đặt/bảo trì, xây bằng cách fork template chính chủ `ecommerce` của Payload CMS (ghim ở bản `v3.87.0`, lấy ra độc lập khỏi Payload monorepo — dependency được ghim version số cụ thể, không phải `workspace:*`).

Đây là **một app Next.js duy nhất**, không phải 2 service frontend/backend tách rời. Payload CMS được gắn chung vào cùng app Next.js qua route group và chạy chung 1 process:

- `src/app/(payload)/` — backend: giao diện `/admin` và REST/GraphQL API tự sinh (`/api/*`)
- `src/app/(app)/` — frontend: storefront công khai (trang chủ, `/shop`, `/products/[slug]`, `/services`, `/services/[slug]`, giỏ hàng, checkout, trang tài khoản)

Các trang frontend gọi thẳng **local API** của Payload trong Server Components (`getPayload({ config })` rồi `payload.find(...)`) — không có bước gọi HTTP riêng giữa "frontend" và "backend".

Package manager là **npm** (không phải pnpm, dù script trong `package.json` và README gốc của template nhắc tới pnpm — bản copy này đã bỏ workspace và cài bằng npm; `.npmrc` set `legacy-peer-deps=true` vì lý do đó).

## Lệnh thường dùng

```bash
npm run dev              # Dev server Next.js + Payload (Turbopack), http://localhost:3000
npm run build             # Build production
npm run start              # Chạy bản build production
npm run lint / lint:fix
npm run generate:types      # Sinh lại src/payload-types.ts từ payload.config.ts (cũng tự chạy khi dev server hot-reload lúc config đổi)
npm run generate:importmap  # Sinh lại import map cho admin panel sau khi thêm custom admin component
npx tsc --noEmit -p tsconfig.json   # Type-check toàn bộ project (không có script riêng trong package.json cho việc này)

npm run payload -- run <path/to/script.ts>   # Chạy 1 script one-off với local API + env của Payload đã bootstrap sẵn
```

Lưu ý về script chạy qua `payload run`: CLI thực hiện `await import(scriptPath)` rồi gọi `process.exit(0)` ngay sau đó không điều kiện. Một script gọi `run().catch(...)` mà không `await` ở top-level sẽ bị kill trước khi chạy xong — phải dùng `await run().catch(...)` ở top-level của script.

Test:

```bash
npx vitest run --config ./vitest.config.mts                          # toàn bộ int test
npx vitest run --config ./vitest.config.mts -t "<tên test>"          # chạy 1 int test theo tên
npx playwright test --config=playwright.config.ts                     # toàn bộ e2e test
npx playwright test --config=playwright.config.ts tests/e2e/admin.e2e.spec.ts   # chạy 1 file e2e
```

Int test nằm ở `tests/int/**/*.int.spec.ts` (vitest + jsdom), e2e test ở `tests/e2e/` (Playwright, cần dev/prod server đang chạy).

## Hạ tầng local

- MongoDB chạy dưới dạng **service native cài trực tiếp** trên máy dev (cổng 27017), không phải Docker. `docker-compose.yml` vẫn còn như phương án dự phòng (`docker compose up -d`) nhưng hiện không dùng — đừng mặc định Docker là nguồn DB.
- `.env` được copy từ `.env.example`; bắt buộc phải có `DATABASE_URL` và `PAYLOAD_SECRET` thì app mới chạy được.
- Yêu cầu Node engine trong `package.json` ghi `^18.20.2 || >=20.9.0`; máy này đang chạy Node v26 vẫn ổn.

## Kiến trúc

### Collections

Được định nghĩa theo 2 cách:
- **Object `CollectionConfig` thuần** trong `src/collections/`: `Pages`, `Services`, `Categories`, `Media`, `Users`. Đăng ký trực tiếp trong mảng `collections` ở `src/payload.config.ts`.
- **Do `@payloadcms/plugin-ecommerce` tự sinh** (cấu hình trong `src/plugins/index.ts`): `Products`, `Variants`, `VariantTypes`, `VariantOptions`, `Carts`, `Addresses`, `Orders`, `Transactions`. Các collection này KHÔNG nằm trong mảng `collections` của `payload.config.ts` — plugin tự inject vào. Muốn tùy biến 1 trong số này (vd `Products`), truyền function `*CollectionOverride` vào `ecommercePlugin({...})`, function này spread `defaultCollection` rồi thêm/ghi đè field — xem `src/collections/Products/index.ts` để thấy pattern (dùng cho `productsCollectionOverride`).

`Services` (dịch vụ lắp đặt/bảo trì/khảo sát) được thêm sau, theo pattern của `Pages` chứ không theo pattern ecommerce plugin, vì đây không phải sản phẩm vật lý/checkout được — nó dùng chung hệ thống layout blocks (kể cả `FormBlock` để gắn form yêu cầu báo giá), draft/live-preview, và tab SEO riêng.

### Đơn vị tiền tệ

Tiền tệ của store là **VND** (đã đổi từ mặc định USD của template), cấu hình qua `currencies: { defaultCurrency: 'VND', supportedCurrencies: [...] }` trong lệnh gọi `ecommercePlugin(...)` ở `src/plugins/index.ts`. VND dùng `decimals: 0` — số tiền lưu dạng số nguyên VND (không nhân với cents) khác với USD dùng `decimals: 2`.

**Bẫy quan trọng về tên field**: ecommerce plugin đặt tên field giá là `priceIn${currencyCode}` tự động theo tiền tệ đang cấu hình. Vì store dùng VND nên field này là `priceInVND` (kèm checkbox `priceInVNDEnabled` đi cùng) ở khắp nơi — trên `Product`, `Variant`, item giỏ hàng, v.v. Nếu sau này thêm tiền tệ khác, mọi chỗ tham chiếu `priceInVND` ở frontend (`ProductGridItem`, `ProductItem`, `CartModal`, `CheckoutPage`, trang sản phẩm/shop, `ThreeItemGrid`, `Carousel`) và `src/lib/constants.ts` (tùy chọn sắp xếp) đều cần cập nhật tương ứng. Component `Price` (`src/components/Price.tsx`) thì không cần sửa gì — nó đọc `supportedCurrencies`/`formatCurrency` động từ client context của ecommerce plugin.

### Kiểm soát truy cập (Access control)

Tập trung ở `src/access/*` (vd `adminOnly`, `adminOrPublishedStatus`, `isAdmin`, `isDocumentOwner`, `customerOnlyFieldAccess`). Ecommerce plugin được nối để dùng lại đúng các function này qua config `access`, không tự định nghĩa access riêng.

### Plugins (`src/plugins/index.ts`)

- `seoPlugin` — meta title/description/image theo từng document, gắn vào tab "SEO" của mọi collection nội dung (`OverviewField`/`MetaTitleField`/`MetaImageField`/`MetaDescriptionField`/`PreviewField` từ `@payloadcms/plugin-seo/fields`)
- `formBuilderPlugin` — hỗ trợ `FormBlock`, dùng được trong mảng `layout` blocks của bất kỳ collection nào (Pages, Services)
- `ecommercePlugin` — products/variants/carts/orders/transactions/addresses, cấu hình tiền tệ, và adapter thanh toán Stripe (`stripeAdapter`) — tích hợp thanh toán chưa được nối để dùng thật (cổng thanh toán VN như VNPay/Momo/ZaloPay sẽ thay thế/bổ sung cho Stripe ở đây khi cần)

### Draft preview / live preview

Mọi collection có preview (`Pages`, `Products`, `Services`) đều gọi `generatePreviewPath({ collection, slug })` từ `src/utilities/generatePreviewPath.ts`, hàm này tra prefix URL từ `collectionPrefixMap`. **Collection mới nào có preview đều phải được thêm vào map này**, nếu không link preview sẽ âm thầm build ra URL sai.

### Revalidation

Mỗi collection có preview/publish đều có hook `afterChange`/`afterDelete` (vd `src/collections/Pages/hooks/revalidatePage.ts`, `src/collections/Services/hooks/revalidateService.ts`) gọi `revalidatePath` của Next khi document được publish/unpublish/xoá. Làm theo pattern này cho collection publish mới thay vì dựa vào ISR theo thời gian.

### Liên kết giữa các collection

`src/fields/link.ts` định nghĩa field `link` dùng chung cho menu nav (global `Header`/`Footer`), block `CallToAction`, và rich text. `relationTo` cho internal-link là 1 mảng liệt kê rõ ràng (hiện tại `['pages', 'services']`) — collection mới muốn link được phải thêm vào đây, VÀ vào `CMSLinkType.reference.relationTo` trong `src/components/Link/index.tsx` (type của component này viết tay, không tự sinh).

### Tối ưu ảnh (`next.config.ts`)

Có 2 cấu hình không hiển nhiên nhưng bắt buộc, vì app tự phục vụ media của chính nó qua HTTP trên cùng origin đang chạy:
- Mỗi entry trong `remotePatterns` phải khai báo rõ `port` (lấy từ `NEXT_PUBLIC_SERVER_URL`) — Next.js coi thiếu `port` nghĩa là "phải không có port", nên `http://localhost:3000/...` sẽ bị từ chối âm thầm nếu thiếu.
- `images.dangerouslyAllowLocalIP` phải bật `true` khi dev — cơ chế chống SSRF của Next image optimizer từ chối fetch từ URL upstream trỏ về IP loopback/private (localhost), mà đây chính xác là trường hợp app tự fetch URL `/api/media/file/...` của chính nó khi chạy local dev.

### Dữ liệu seed

`src/endpoints/seed/` + nút "Seed database" trong admin dashboard (`src/components/BeforeDashboard/SeedButton`) tạo sẵn trang/sản phẩm/đơn hàng demo. **Có tính phá hủy** — dùng cho project mới tinh, không dùng khi DB đã có dữ liệu thật (theo README gốc). Giá trị giá trong seed đã được điều chỉnh từ đơn vị cents-kiểu-USD sang đơn vị nguyên VND khi đổi tiền tệ.
