---
name: import-vuhoang-products
description: Cào dữ liệu sản phẩm camera từ vuhoangtelecom.vn, viết lại mô tả, và nhập vào Payload (Products/Brands/Categories/Media) của site này. Dùng khi cần bổ sung/nhập thêm sản phẩm camera thật vào camgiare.vn.
---

# Nhập sản phẩm camera từ vuhoangtelecom.vn

Skill này lấy dữ liệu sản phẩm thật (tên, giá, giảm giá, SKU, hãng, thông số kỹ thuật, ảnh) từ các trang danh mục camera của vuhoangtelecom.vn, viết lại mô tả để tránh trùng nội dung, và nhập vào collection `products` (kèm `brands`/`categories`/`media`) của site này qua Payload local API.

**Chỉ lấy phạm vi camera quan sát** (đúng với site này) — không lấy tổng đài/PBX/kiểm soát cửa/network switch của vuhoangtelecom.vn dù họ có bán.

Chạy lại được nhiều lần, an toàn: bước import bỏ qua sản phẩm đã tồn tại (so khớp theo `slug`), không tạo trùng.

## Quy trình 3 bước

### Bước 1 — Cào dữ liệu (deterministic, không cần LLM)

```bash
node .claude/skills/import-vuhoang-products/scripts/scrape.mjs --categories=camera-ip,camera-trong-nha,camera-ngoai-troi,camera-4g,dau-ghi-hinh-camera --limit=110 --out=.claude/skills/import-vuhoang-products/tmp/scraped.json
```

- `--categories`: danh sách slug category trên vuhoangtelecom.vn (không có `/` đầu/cuối). Mặc định đã hợp lý cho phạm vi camera quan sát nếu không truyền.
- `--limit`: tổng số sản phẩm mục tiêu (dedupe theo URL, round-robin qua các category).
- Luôn test trước với `--limit=10` để soát dữ liệu ra đúng trước khi cào full.
- Script tải luôn ảnh gallery về `.claude/skills/import-vuhoang-products/tmp/images/{slug}/` — không phụ thuộc link sống của vuhoangtelecom.vn nữa sau khi đã cào xong (an toàn khi làm thật về sau, không rủi ro nếu họ đổi/gỡ ảnh).

### Bước 2 — Viết lại mô tả (do agent làm, không phải code cố định)

Đọc `scraped.json`, với mỗi sản phẩm: dựa vào `bulletFeatures` + `specifications` đã cào được, viết 2-3 đoạn mô tả tiếng Việt ngắn, **diễn đạt lại hoàn toàn** (không copy câu nào nguyên văn từ nguồn), đúng thông tin kỹ thuật đã có (không bịa thêm specs không có trong dữ liệu), giọng bán hàng nhẹ nhàng, không nhồi từ khoá. Làm theo lô ~15-20 sản phẩm/lượt để không quá tải 1 turn. Ghi field `description` vào từng object, lưu thành `.claude/skills/import-vuhoang-products/tmp/enriched.json`.

### Bước 3 — Nhập vào Payload

```bash
npm run payload -- run .claude/skills/import-vuhoang-products/scripts/import.mjs -- --input=.claude/skills/import-vuhoang-products/tmp/enriched.json
```

- Đọc ảnh từ file local trong `imagePaths` (đã tải sẵn ở Bước 1) và upload thành Media.
- Find-or-create `Brand` theo tên, `Category` theo tên.
- Bỏ qua (skip) nếu Product với `slug` đó đã tồn tại — an toàn để chạy lại.
- In summary: created / skipped / failed.
- Luôn test với 1 batch nhỏ (sửa `enriched.json` chỉ giữ ~10 sản phẩm, hoặc thêm cờ `--limit=10` nếu cần) trước khi chạy full, rồi vào `/admin` kiểm tra Brand/Category/Media/Product tạo đúng và vào `/products/[slug]` xem hiển thị đúng.

## Tái sử dụng sau này (kể cả lên server thật)

- `import.mjs` chỉ dùng `getPayload({config})` — tự đọc `DATABASE_URL`/`PAYLOAD_SECRET` của env đang active. Muốn nhập lên server thật: deploy code như thường (skill nằm trong repo), SSH vào server, chạy lại từ Bước 1 (cào + tải ảnh ngay trên server đó) rồi Bước 3 — không cần sửa script, không cần mang theo dữ liệu đã cào ở máy dev.
- Nếu sau này đổi lưu ảnh từ local sang MinIO/S3, không cần sửa `import.mjs` — storage adapter do `payload.config.ts` quyết định, Media vẫn tạo qua `payload.create` như cũ.
- Muốn nhập thêm sản phẩm mới sau này: chạy lại từ Bước 1 với category/limit khác, sản phẩm cũ không bị đụng tới (idempotent theo slug).
