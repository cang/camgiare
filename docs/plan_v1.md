# Phân tích bố cục vuhoangtelecom.vn đối chiếu với hiện trạng codebase

## Bối cảnh

Mục tiêu ban đầu là làm 1 website tương tự vuhoangtelecom.vn (bán camera quan sát + dịch vụ lắp đặt), nhấn mạnh SEO tốt. Đã dựng xong khung admin (Payload CMS) và vài trang storefront cơ bản (trang chủ, `/shop`, `/products/[slug]`, `/services`, `/services/[slug]`, giỏ hàng, checkout, tài khoản). Nhưng so với trang tham khảo, còn thiếu rất nhiều thành phần giao diện — đặc biệt là các phần phục vụ SEO (blog, breadcrumb, structured data, trang danh mục riêng) và các phần tăng tin cậy/chuyển đổi (testimonial, FAQ, banner khuyến mãi, nút liên hệ nổi...).

Tài liệu này là **bản đối chiếu** — không phải kế hoạch thi công 1 lần, vì khối lượng quá lớn để làm trong 1 lượt. Cuối tài liệu có đề xuất chia giai đoạn và câu hỏi để chọn giai đoạn bắt đầu trước.

Đã khảo sát vuhoangtelecom.vn ở 4 trang: trang chủ, trang danh mục (`/camera-quan-sat/`), trang chi tiết sản phẩm, trang dịch vụ lắp đặt trọn bộ. Đã khảo sát codebase hiện tại qua agent Explore (đọc `src/blocks/`, `src/app/(app)/`, `src/components/`, `src/globals/Header.ts`, `src/globals/Footer.ts`).

## Bảng đối chiếu

Chú thích trạng thái: ✅ Đã có · ⚠️ Có một phần · ❌ Chưa có

### A. Header / thanh điều hướng

| Thành phần bên vuhoangtelecom.vn | Trạng thái | Ghi chú |
|---|---|---|
| Thanh thông báo trên cùng (hotline theo khu vực HCM/HN) | ❌ | Không có field nào cho top bar/hotline trong `src/globals/Header.ts` |
| Thanh CSKH phụ (dropdown email/chat/zalo) | ❌ | — |
| Header chính: logo + search + tài khoản + giỏ hàng + mega-menu 10+ danh mục | ⚠️ | Có logo, giỏ hàng (`Cart`), nhưng **không có ô search trong header** (search chỉ nằm ở trang `/shop`), **không có mega-menu** — `Header` global chỉ là 1 mảng `navItems` phẳng, tối đa 6 mục |
| Tra cứu bảo hành | ❌ | — |
| Tài liệu tải về (hướng dẫn sử dụng, driver...) | ❌ | — |

### B. Trang chủ

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Hero carousel nhiều slide khuyến mãi | ✅/⚠️ | Có `heros/HighImpact`, `MediumImpact`, `LowImpact` + block `Carousel` — hạ tầng có sẵn, chỉ cần nội dung/nhiều slide hơn |
| Lưới icon danh mục (16 icon) | ❌ | Không có block riêng; `Categories` component hiện chỉ dùng làm sidebar lọc ở `/shop`, không phải khối trang chủ dạng icon-grid |
| Flash sale / đếm ngược | ❌ | — |
| Banner quảng cáo lớn | ⚠️ | Có block `Banner` (dạng alert màu info/warning) và `MediaBlock`, nhưng không có "banner khuyến mãi" đúng nghĩa marketing |
| Gợi ý sản phẩm cá nhân hoá / sản phẩm mới | ⚠️ | Có thể ghép từ block `Archive`/`Carousel`/`ThreeItemGrid` (đã có sẵn, chọn theo collection hoặc thủ công) |
| Bài viết "Thông tin hữu ích" (blog) | ❌ | **Không có collection blog/posts nào cả** — đây là lỗ hổng SEO lớn nhất vì không có nội dung cập nhật thường xuyên |
| Đăng ký nhận email khuyến mãi | ❌ | — |
| Lưới liên kết nhanh (từ khoá phổ biến) | ❌ | — |
| 4 ô "cam kết" (hàng chính hãng, giao nhanh...) | ❌ | Có thể dựng bằng `Content` block nhưng chưa có component chuyên biệt |
| Icon mạng xã hội | ❌ | — |
| Footer 4 cột (CSKH, chính sách, công ty, liên hệ 3 chi nhánh + bản đồ) | ❌ | `Footer` global hiện chỉ có 1 cột `navItems` (tối đa 6 mục) + logo cứng + dòng credit cứng trong code — không có field cột, social, liên hệ |
| Popup form liên hệ | ❌ | — |

### C. Trang danh mục sản phẩm (category listing)

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Breadcrumb | ❌ | Trang sản phẩm/dịch vụ chỉ có nút "quay lại", không có breadcrumb thật |
| Trang danh mục riêng có URL/nội dung/meta riêng | ❌ | **Quan trọng cho SEO**: hiện tại lọc danh mục ở `/shop` chỉ qua query param (`?category=`), không có route `/shop/[category]` hay trang landing riêng cho từng danh mục → không tối ưu được SEO on-page theo từng danh mục |
| Sidebar lọc: hãng, khoảng giá, loại sản phẩm, độ phân giải | ⚠️ | Chỉ có lọc theo danh mục (chọn 1) + sắp xếp (`FilterList`); chưa có lọc theo giá, hãng, thuộc tính khác |
| Dropdown sắp xếp | ✅ | `FilterItemDropdown` |
| Lưới sản phẩm với badge giảm giá % | ⚠️ | `ProductGridItem` hiện chỉ hiện ảnh/tên/giá, chưa xác nhận có giá gạch ngang + % giảm |
| Phân trang | ⚠️ | Có sẵn primitive `ui/pagination.tsx` nhưng **chưa nối vào đâu cả** — các trang đang fetch không giới hạn/không phân trang |
| Khối nội dung SEO dài ở cuối trang danh mục | ❌ | Không có do chưa có trang danh mục riêng |

### D. Trang chi tiết sản phẩm

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Breadcrumb | ❌ | — |
| Gallery ảnh + badge giảm giá trên ảnh | ⚠️ | Có `product/Gallery.tsx`, chưa có badge giảm giá đè lên ảnh, chưa xác nhận có zoom |
| Tên/mã SP/link thương hiệu/tag danh mục | ⚠️ | Có tiêu đề/giá/chọn biến thể; chưa rõ có taxonomy "thương hiệu" riêng để link |
| Giá hiện tại + giá gốc gạch ngang + % tiết kiệm | ⚠️ | `Price` component format tiền tệ tốt, nhưng chưa xác nhận UI so sánh giá gốc/giá giảm |
| Chọn số lượng, tình trạng kho, nút mua, link tư vấn | ⚠️ | Có `AddToCart`, `StockIndicator`, `VariantSelector`; chưa có link "tư vấn mua hàng" |
| Icon chia sẻ mạng xã hội | ❌ | — |
| Mô tả + bảng thông số kỹ thuật dạng bảng | ⚠️ | Có rich text mô tả, chưa có component bảng specs chuyên biệt |
| FAQ riêng theo sản phẩm | ❌ | Có sẵn primitive `ui/accordion.tsx` nhưng chưa dùng ở đâu |
| Khối giới thiệu thương hiệu | ❌ | — |
| Sản phẩm liên quan (carousel) | ✅ | `RelatedProducts`, field `relatedProducts` sẵn có |
| Sản phẩm đã xem gần đây | ❌ | — |
| Đánh giá/rating + form gửi đánh giá | ❌ | Không có field rating/review nào trong schema Products |
| Thanh mua hàng dính (sticky add-to-cart) | ❌ | — |

### E. Trang dịch vụ lắp đặt

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Thẻ gói dịch vụ dạng card theo loại | ⚠️ | Có lưới service card cơ bản (`services/page.tsx`), chưa phân loại theo nhóm dịch vụ như bên tham khảo |
| Lọc theo khoảng giá | ❌ | — |
| Phân trang | ⚠️ | Cùng vấn đề như mục C — primitive có nhưng chưa nối |
| Form yêu cầu báo giá/đặt lịch | ⚠️ | Chưa có widget đặt lịch chuyên biệt; có thể tận dụng `FormBlock` (form builder) đã có sẵn hạ tầng, field `pricing.pricingType: 'quote'` đã có sẵn trên Services |

### F. Xuyên suốt / hạ tầng SEO & tiện ích

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Nút nổi (Zalo/Messenger/gọi điện/lên đầu trang) | ❌ | Không có component, không tìm thấy từ khoá liên quan trong `src/` |
| Blog/tin tức + trang bài viết | ❌ | Không có collection `posts`, không có route bài viết |
| Testimonial/đánh giá khách hàng (trang chủ) | ❌ | — |
| FAQ (trang chủ hoặc trang riêng) | ❌ | — |
| Dải logo thương hiệu đối tác | ❌ | — |
| Sitemap.xml | ❌ | Đã kiểm tra — không có `sitemap.ts` nào trong `src/app/(app)/` |
| Robots.txt | ✅ | Có `robots.ts` |
| Structured data (JSON-LD) | ⚠️ | Có Product schema và Service schema; chưa có Organization/LocalBusiness schema, BreadcrumbList schema, Article schema (vì chưa có blog) |
| Trang tài khoản/đơn hàng/giỏ hàng/checkout | ✅ | Đã có đầy đủ luồng cơ bản |

## Tổng kết theo nhóm ưu tiên

**Nhóm 1 — Hạ tầng SEO nền tảng (tác động lớn nhất, đúng trọng tâm "SEO tốt" ban đầu):**
Blog/Posts collection + trang bài viết, breadcrumb component dùng chung, trang danh mục riêng (route thật thay vì query param), sitemap.xml, mở rộng structured data (Organization + BreadcrumbList).

**Nhóm 2 — Header/Footer đầy đủ thông tin (ảnh hưởng mọi trang, cũng có giá trị SEO/trust local business):**
Mở rộng `Header`/`Footer` global: thêm field logo, top bar hotline, mega-menu, footer nhiều cột + thông tin liên hệ nhiều chi nhánh + social links.

**Nhóm 3 — Khối tăng chuyển đổi/tin cậy (marketing-facing blocks):**
Block Testimonials, FAQ (đã có primitive accordion sẵn), Brand-logos strip, Promo-banner thật sự (khác Banner-alert hiện tại), nút liên hệ nổi (Zalo/phone/back-to-top), newsletter signup.

**Nhóm 4 — UX trang danh mục/sản phẩm:**
Lọc theo giá/hãng, phân trang thật (nối `ui/pagination.tsx`), badge giảm giá + giá gốc gạch ngang, bảng specs, đánh giá/rating sản phẩm, sản phẩm đã xem gần đây, sticky add-to-cart.

**Nhóm 5 — Trang dịch vụ nâng cao:**
Phân loại gói dịch vụ theo nhóm, lọc giá, widget đặt lịch/báo giá chuyên biệt (có thể build trên `FormBlock` sẵn có).

## Người dùng đã chọn: bắt đầu với Nhóm 1 — Hạ tầng SEO

## Kế hoạch triển khai chi tiết — Nhóm 1

Đã đọc thêm các file mẫu để bám đúng pattern hiện có: `src/collections/Services/index.ts`, `src/collections/Services/hooks/revalidateService.ts`, `src/collections/Categories.ts`, `src/utilities/generatePreviewPath.ts`, `src/fields/link.ts`, `src/app/(app)/robots.ts`, `src/app/(app)/layout.tsx`, JSON-LD trong `src/app/(app)/products/[slug]/page.tsx`.

**Phát hiện thêm cần sửa trong lượt này (không nằm trong bảng đối chiếu ban đầu vì so với vuhoangtelecom.vn không thấy được, nhưng là lỗi SEO nền tảng):**
- `src/app/(app)/layout.tsx`: toàn bộ block `export const metadata` (metadataBase, title template, robots, twitter card) đang **bị comment hết** — nghĩa là hiện tại không có metadata mặc định nào ở cấp root. `lang="en"` cũng đang hardcode dù nội dung là tiếng Việt → phải sửa `lang="vi"`.
- `src/app/(app)/robots.ts` dùng `NEXT_PUBLIC_VERCEL_URL` để tính `baseUrl`, trong khi phần còn lại của app (vd `next.config.ts` cho `remotePatterns`) dùng `NEXT_PUBLIC_SERVER_URL` (đã có sẵn trong `.env.example`). Không nhất quán → khi deploy ngoài Vercel, `robots.txt`/`sitemap.xml` sẽ trỏ sai domain. Cần gộp về 1 nguồn `baseUrl` dùng chung.
- `SITE_NAME` trong `.env.example` vẫn là placeholder `"Payload Commerce"` — cần đổi tên thật của brand khi implement.

**1. Collection `Posts` (blog/tin tức)**
- File mới `src/collections/Posts/index.ts`, dựng theo đúng khuôn `src/collections/Services/index.ts`: field `title`, `excerpt` (textarea, dùng làm mô tả SEO mặc định), `coverImage` (upload → media), tab "Content" (richText + `layout` blocks: có thể tái dùng `CallToAction`, `Content`, `MediaBlock`), tab "SEO" (dùng lại `OverviewField`/`MetaTitleField`/`MetaImageField`/`MetaDescriptionField`/`PreviewField` từ `@payloadcms/plugin-seo/fields` y hệt Services), `slugField()`, `publishedAt` (date), `versions.drafts.autosave`.
- Đăng ký `Posts` vào mảng `collections` trong `src/payload.config.ts` (Posts là plain CollectionConfig, đi theo nhánh "object thuần" chứ không phải plugin ecommerce sinh ra).
- Hook revalidate mới `src/collections/Posts/hooks/revalidatePost.ts`, sao chép logic từ `revalidateService.ts` nhưng path là `/tin-tuc/${doc.slug}` + `/tin-tuc`.
- Thêm `posts: '/tin-tuc'` vào `collectionPrefixMap` trong `src/utilities/generatePreviewPath.ts`.
- Nếu muốn menu/CTA/rich text link được tới bài viết: thêm `'posts'` vào mảng `relationTo` của field `reference` trong `src/fields/link.ts` (dòng có `relationTo: ['pages', 'services']`) VÀ vào `CMSLinkType.reference.relationTo` trong `src/components/Link/index.tsx` (type viết tay, không tự sinh).
- Route mới: `src/app/(app)/tin-tuc/page.tsx` (danh sách bài viết, có phân trang — dùng `ui/pagination.tsx` sẵn có, hiện chưa được nối chỗ nào) và `src/app/(app)/tin-tuc/[slug]/page.tsx` (chi tiết bài viết, `generateMetadata` từ `meta.title`/`meta.description`, `RenderBlocks` cho layout, JSON-LD `@type: 'Article'` theo đúng pattern inline `dangerouslySetInnerHTML` đang dùng ở `products/[slug]/page.tsx`).

**2. Component `Breadcrumbs` dùng chung**
- File mới `src/components/Breadcrumbs/index.tsx`: nhận props `items: { label: string; href?: string }[]`, render bằng `Link`/`CMSLink` sẵn có, kèm JSON-LD `@type: 'BreadcrumbList'` inline (cùng cách làm với Product JSON-LD).
- Áp dụng vào: `products/[slug]/page.tsx` (thay nút "quay lại" hiện tại hoặc đặt cạnh), `services/[slug]/page.tsx`, `tin-tuc/[slug]/page.tsx` (mục 1), và trang danh mục mới (mục 3).

**3. Trang danh mục sản phẩm có route/nội dung/meta riêng**
- Mở rộng `src/collections/Categories.ts`: thêm `description` (richText ngắn, dùng làm khối nội dung SEO cuối trang danh mục) và tab "SEO" y hệt pattern Services/Posts. Cân nhắc thêm `coverImage` tuỳ chọn.
- Route mới `src/app/(app)/shop/[category]/page.tsx`: query `products` where `categories.contains(category.slug)` (logic lọc y hệt đoạn đang có trong `shop/page.tsx`, chỉ khác là slug lấy từ route param thay vì query string), `generateMetadata` từ `category.meta`, `Breadcrumbs` (Trang chủ > Cửa hàng > {category.title}), khối `description` render cuối trang.
- Giữ nguyên `/shop?category=` hiện tại làm trang tìm kiếm/tổng hợp — không phá luồng cũ, chỉ thêm route landing riêng cho SEO.
- Categories hiện không có `_status`/draft nên luôn public — vẫn nên thêm hook `afterChange`/`afterDelete` gọi `revalidatePath('/shop/' + slug)` để khớp pattern revalidate của các collection khác.

**4. `sitemap.xml`**
- File mới `src/app/(app)/sitemap.ts`, export default function trả về `MetadataRoute.Sitemap`, dùng chung 1 `baseUrl` đã sửa nhất quán ở phần "phát hiện thêm" bên trên.
- Query local API lấy tất cả `pages`, `products`, `services`, `posts` (mới), `categories` đã published (`_status: 'published'` nơi có field này), map thành `{ url, lastModified: updatedAt }`.

**5. Mở rộng structured data**
- JSON-LD `Organization`/`LocalBusiness` (tên công ty, logo, địa chỉ, hotline) — đặt ở `src/app/(app)/layout.tsx`, tái dùng cùng cách inline `<script type="application/ld+json">` đã thấy ở product page.
- `BreadcrumbList` — đi kèm component `Breadcrumbs` (mục 2).
- `Article` — đi kèm trang chi tiết bài viết (mục 1).

## Kiểm thử

- `npm run generate:types` sau khi thêm collection `Posts`/sửa `Categories` để `payload-types.ts` cập nhật.
- `npm run dev`, vào `/admin` tạo thử 1 bài viết + xác nhận `/tin-tuc` và `/tin-tuc/[slug]` render đúng, JSON-LD hợp lệ (dán vào Google Rich Results Test).
- Vào `/shop/[category-slug]` xác nhận lọc đúng sản phẩm, meta title/description đúng theo category.
- Truy cập `/sitemap.xml` và `/robots.txt` xác nhận URL đúng domain, liệt kê đủ pages/products/services/posts/categories đã publish.
- Kiểm tra breadcrumb + JSON-LD trên trang sản phẩm, dịch vụ, bài viết, danh mục.
- `npx tsc --noEmit -p tsconfig.json` để bắt lỗi type sau khi sửa `link.ts`/`Link/index.tsx`/`generatePreviewPath.ts`.

## Đề xuất bổ sung — lỗi kỹ thuật SEO & UI phát hiện thêm

Ngoài các thành phần còn thiếu so với vuhoangtelecom.vn ở trên, khảo sát sâu hơn vào code hiện có phát hiện thêm một số vấn đề **đang có sẵn nhưng sai/thiếu**, không phụ thuộc vào việc có làm Nhóm 1 hay không — nên sửa sớm vì rẻ và ảnh hưởng rộng.

### Nhóm nhanh, không cần quyết định về thương hiệu — ĐÃ LÀM (2026-08-03)

Mục 1-2-3-5-6-7-8-9-10-11-12-14 dưới đây đã được code. Ghi chú riêng 2 mục:
- **Mục 9** (alt ảnh rỗng): kiểm tra lại thì field `alt` trên collection `Media` (`src/collections/Media.ts`) đã `required: true` sẵn — CMS bắt buộc nhập alt khi upload, nên rủi ro chỉ còn ở dữ liệu seed/cũ, không cần sửa code.
- **Mục 13** (Google Search Console/Analytics): không tự làm được vì cần tài khoản/ID thật từ bạn (GA4 measurement ID hoặc thẻ verification của Search Console) — sẽ làm khi có.
- Tiện thể đã dọn luôn phần đầu của mục 15 (OG mặc định trỏ vào payloadcms.com) ở mức cơ chế: `mergeOpenGraph.ts` giờ đọc `SITE_NAME`/`SITE_DESCRIPTION` từ env thay vì hardcode "Payload Website Template" + ảnh OG của payloadcms.com. Giá trị thật của `SITE_NAME` trong `.env` vẫn cần bạn cập nhật (thuộc Nhóm B).



| # | Vấn đề | File | Đề xuất |
|---|---|---|---|
| 1 | `metadataBase` chưa từng được set ở bản live (chỉ có trong block bị comment) → OG/twitter image sẽ resolve sai domain khi lên production | `src/app/(app)/layout.tsx:22-40` | Bật lại `export const metadata` với `metadataBase: new URL(NEXT_PUBLIC_SERVER_URL)` |
| 2 | `lang="en"` hardcode dù nội dung tiếng Việt | `src/app/(app)/layout.tsx:46` | Đổi thành `lang="vi"` |
| 3 | `<link rel="icon" href="/favicon.svg">` trỏ tới file **không tồn tại** — 404 âm thầm | `src/app/(app)/layout.tsx:52` | Xoá link chết, hoặc xuất `LogoIcon` hiện có thành file `public/favicon.svg` tạm thời |
| 4 | Không có `manifest.json`/`site.webmanifest`, không có `apple-touch-icon`, không có `theme-color` | — | Thêm `src/app/(app)/manifest.ts` (Next hỗ trợ generate động) + icon 180x180 cho iOS |
| 5 | `robots.ts` dùng `NEXT_PUBLIC_VERCEL_URL` để tính domain, còn `next.config.ts`/`generateMeta.ts` dùng `NEXT_PUBLIC_SERVER_URL` → không nhất quán, sai domain khi deploy ngoài Vercel | `src/app/(app)/robots.ts:2-4` | Đổi về `NEXT_PUBLIC_SERVER_URL` cho đồng nhất |
| 6 | Trang chi tiết sản phẩm tự viết `generateMetadata` riêng, không dùng chung `generateMeta`/`mergeOpenGraph` như trang Pages/Services → `og:image` là URL tương đối (`/api/media/file/...`), sẽ vỡ khi Zalo/Facebook fetch | `src/app/(app)/products/[slug]/page.tsx:23-60` | Chuyển sang dùng `generateMeta()` giống 2 collection còn lại |
| 7 | Ảnh gallery chính của trang sản phẩm (nhiều khả năng là LCP element) không có `priority` → chậm Core Web Vitals đúng ở trang quan trọng nhất | `src/components/product/Gallery.tsx:53-57` | Thêm `priority` cho ảnh đầu tiên, giống cách `heros/HighImpact` đã làm đúng |
| 8 | `next.config.ts` không bật `images.formats: ['image/avif', 'image/webp']` → bỏ lỡ nén ảnh tốt nhất | `next.config.ts` | Thêm cấu hình `formats` |
| 9 | `alt` ảnh fallback về chuỗi rỗng khi CMS chưa nhập → mất điểm SEO ảnh + a11y | `src/components/Media/Image/index.tsx:64` | Fallback về tiêu đề sản phẩm/trang khi `alt` trống, thay vì `''` |
| 10 | `Sheet` trigger mở menu mobile chỉ có icon, không có `aria-label` | `src/components/Header/MobileMenu.tsx:50` | Thêm `aria-label="Mở menu"` |
| 11 | Thiếu `loading.tsx` cho `products/[slug]`, `services/[slug]`, `services/page.tsx` (chỉ `/shop` có) | `src/app/(app)/**` | Thêm skeleton loading tương tự `shop/loading.tsx` |
| 12 | `/shop` không set `alternates.canonical` hay `noindex` cho các biến thể `?q=`/`?sort=`/`?category=` → rủi ro duplicate/thin content | `src/app/(app)/shop/page.tsx` | Thêm `generateMetadata` động: canonical về `/shop` sạch, `robots: { index: false }` khi có `q`/`sort` |
| 13 | Chưa gắn Google Search Console verification / Google Analytics/GTM nào cả | — | Thêm meta verification + GA4 (hoặc GTM) khi có tài khoản |
| 14 | `error.tsx` vẫn dùng màu cứng `border-neutral-200`/`bg-blue-600` của template gốc, không theo design token (`bg-background`/`bg-primary`) của app | `src/app/(app)/error.tsx:7,14` | Đổi sang class token hiện có, dùng component `Button` sẵn có thay vì `<button>` thô |

### Nhóm cần quyết định thương hiệu — ĐÃ LÀM (2026-08-03)

Thông tin thương hiệu do bạn cung cấp: `SITE_NAME=camgiare.vn`, `COMPANY_NAME=Phú Gia Cát`, logo tại `docs/images/logo.png`, màu do tôi chọn theo logo.

| # | Vấn đề | File | Đã làm |
|---|---|---|---|
| 15 | Fallback Open Graph mặc định trỏ vào payloadcms.com | `src/utilities/mergeOpenGraph.ts` | Đổi sang đọc `SITE_NAME`/`SITE_DESCRIPTION` từ env, bỏ ảnh OG hardcode của Payload |
| 16 | Fallback title là `'Payload Ecommerce Template'` | `src/utilities/generateMeta.ts` | Đổi fallback theo `SITE_NAME` |
| 17 | Logo SVG có `aria-label="Logo Payload"` | `src/components/icons/logo.tsx` | Xoá hẳn file này (mồ côi sau khi thay logo thật), thay bằng `Logo` component dùng ảnh thật với `alt="Phú Gia Cát"` |
| 18 | `SITE_NAME`/`COMPANY_NAME` trong `.env`/`.env.example` là placeholder Payload | `.env`, `.env.example` | Cập nhật `SITE_NAME=camgiare.vn`, `COMPANY_NAME=Phú Gia Cát`, thêm `SITE_DESCRIPTION`, bỏ `TWITTER_*` (chưa dùng Twitter/X) |
| 19 | Bảng màu grayscale thuần, chưa có màu nhận diện | `src/app/(app)/globals.css` | Lấy màu từ logo bằng cách phân tích pixel: xanh dương `#105898` (mái nhà, roof) làm `--primary`/`--ring` (light: `#105898`, dark: `#2b7fc4` sáng hơn để đủ tương phản trên nền tối); cam `#f05a22` (mặt trời) làm token mới `--brand-accent` (class `bg-brand-accent`, dùng cho badge/CTA khuyến mãi sau này — không đổi `--accent` gốc vì đó là màu hover trung tính của shadcn, đổi sẽ ảnh hưởng hover state ở khắp nơi không liên quan gì tới thương hiệu). Đồng thời đổi focus ring toàn app (`a,input,button`) từ `ring-neutral-400` cứng sang `ring-ring` để nhất quán theo màu thương hiệu |
| 20 | Logo là icon "P" của Payload | `src/components/icons/logo.tsx` | Dùng `docs/images/logo.png` thật: copy vào `public/logo.png`, dựng lại `src/components/Logo/Logo.tsx` render bằng `next/image`, dùng ở cả `Header` và `Footer` (đã bỏ hẳn `LogoIcon` cũ) |

**Việc phát sinh thêm cùng lúc (favicon/PWA, mục 4 ở nhóm A):** Dùng `sharp` (đã có sẵn trong `node_modules`) để tự cắt logo thành `src/app/(app)/icon.png` (256x256, nền trong suốt, Next.js tự nhận theo file convention, không cần `<link>` thủ công), `src/app/(app)/apple-icon.png` (180x180, nền trắng vì iOS không xử lý tốt icon trong suốt), `public/icon-192.png`/`public/icon-512.png` cho `manifest.ts`. Đã xoá `favicon.ico` cũ (icon mặc định của Payload) và bỏ `<link rel="icon">` thủ công trong `layout.tsx`. `manifest.ts`/`viewport.themeColor` cũng đổi theo màu xanh thương hiệu (`#105898` light, `#0a0a0a` dark).

**Đã dọn thêm (phát hiện khi rà theo từ khoá "Payload"/"Michigan" trong `src/`):** Footer có 2 dòng thừa từ template gốc — "Được thiết kế tại Michigan" và "Được xây dựng bởi Payload" (link ra payloadcms.com) — đã xoá cả hai, chỉ giữ dòng bản quyền dùng `COMPANY_NAME`.

**Phát hiện mới, CHƯA sửa (ngoài phạm vi brand, để riêng vì cần bộ dữ liệu tỉnh/thành VN):** field chọn "State" trong form builder (`src/blocks/Form/State/options.ts`) đang liệt kê danh sách bang của Mỹ (Michigan, California...) — sai thị trường cho form liên hệ/báo giá của khách Việt Nam. Cần thay bằng danh sách 63 tỉnh/thành VN nếu form nào dùng field này (vd form yêu cầu báo giá dịch vụ lắp đặt).
