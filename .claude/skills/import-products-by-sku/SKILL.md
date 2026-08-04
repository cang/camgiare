---
name: import-products-by-sku
description: Nhập sản phẩm vào Payload (Products/Brands/Categories/Media) của site này theo một danh sách "Mã sản phẩm" (SKU) có sẵn — từ file Excel/CSV cục bộ hoặc link Google Sheet — bằng cách đối chiếu chính xác theo SKU trên vuhoangtelecom.vn, nhaantoan.com, sieuthivienthong.com để lấy mô tả ngắn/mô tả dài/thông số kỹ thuật, còn ảnh lấy trực tiếp từ file input nếu có kèm sẵn. Dùng khi đã có sẵn 1 file báo giá/danh sách SKU (không phải duyệt category từ đầu — khác với skill `import-vuhoang-products`).
---

# Nhập sản phẩm theo danh sách Mã sản phẩm (đối chiếu nhiều site)

Khác với `import-vuhoang-products` (duyệt category trên vuhoangtelecom.vn để tự phát hiện sản phẩm), skill này dùng khi đã có sẵn **danh sách Mã sản phẩm cụ thể** (từ nhà cung cấp, file báo giá...) và cần bổ sung nội dung thật (mô tả, thông số, ảnh) bằng cách tìm đúng SKU đó trên các trang bán hàng thật.

Chạy lại được nhiều lần, an toàn: bước import bỏ qua sản phẩm đã tồn tại (so khớp theo `slug` tạo từ SKU), không tạo trùng.

## Quy trình 4 bước

### Bước 0 — Đọc danh sách SKU đầu vào

```bash
node .claude/skills/import-products-by-sku/scripts/load-input.mjs --file="docs/source/BÁO GIÁ LẺ HIKFIRE T8.2026.xlsx" --out=.claude/skills/import-products-by-sku/tmp/input.json
# hoặc dùng link Google Sheet (tự resolve shortlink + /edit -> /export?format=csv):
node .claude/skills/import-products-by-sku/scripts/load-input.mjs --sheet=<url-hoac-shortlink> --out=...
```

- `--file` nhận `.xlsx` (đọc bằng `exceljs`, **tự lấy luôn ảnh nhúng trong file** nếu cột "Hình ảnh" có ảnh dán trực tiếp vào cell — map theo đúng dòng, ghi ra `tmp/images/{sku-slug}.{ext}`) hoặc `.csv` (không có ảnh).
- Tự dò dòng header theo cột "Mã sản phẩm" — không phụ thuộc số dòng banner phía trên trong file.
- Các cột khác được nhận diện theo tên (không phân biệt hoa/thường): `Thương hiệu`, `Mô tả` (dùng làm tên tạm), `Chứng chỉ`, `Mô tả chi tiết`, `Bảo hành (tháng)`, `Giá lẻ (Có VAT)`, `Tình trạng hàng`. Thiếu cột nào thì field tương ứng để trống, không lỗi.
- Luôn mở vài ảnh trong `tmp/images/` (dùng Read tool xem ảnh) để soát ảnh có đúng khớp SKU dòng đó không trước khi đi tiếp — đã gặp trường hợp 1 ảnh dùng chung cho 2 SKU biến thể giống nhau, đó là bình thường, nhưng ảnh sai hẳn sản phẩm thì cần dừng lại kiểm tra file gốc.

### Bước 1 — Tra cứu theo SKU trên 3 site tham khảo (deterministic, không cần LLM)

```bash
node .claude/skills/import-products-by-sku/scripts/scrape-by-sku.mjs --input=.claude/skills/import-products-by-sku/tmp/input.json --out=.claude/skills/import-products-by-sku/tmp/scraped.json
```

- Luôn test trước với `--limit=5`.
- Với mỗi SKU, tra độc lập trên cả 3 site (vuhoangtelecom.vn, nhaantoan.com, sieuthivienthong.com) — mỗi site 1 adapter riêng vì cơ chế tìm kiếm khác nhau (2 site đầu: GET `?s=` tự redirect; site thứ 3: POST `seracharg=` ra list kết quả). **Chỉ nhận khi trang đích tự khai đúng SKU chính xác** (không phải chỉ khớp theo chữ xuất hiện trong tên/URL) — vì cả 3 site đều có thể trả nhầm sản phẩm gần giống khi tìm theo substring (VD tìm "HF-S3E" ra nhầm "HF-S3E-R").
- Ảnh **không** được cào ở bước này (đã có `imagePathFromExcel` từ Bước 0 làm nguồn ảnh chính, sạch/không watermark hơn ảnh cào lại từ web) — nếu sau này dùng file input không có ảnh kèm sẵn, cần bổ sung thêm bước tải ảnh vào adapter tương ứng.
- SKU không khớp site nào sẽ được in ra cuối log — sang Bước 2 cần tự `WebSearch`/`WebFetch` tra cứu thêm cho đúng các SKU này, nếu vẫn không ra gì thì viết mô tả hoàn toàn từ `detailedDescriptionFromSheet`/`certifications` đã có trong `input.json`.
- **Luôn đối chiếu số liệu cào được với `detailedDescriptionFromSheet`** trước khi tin — đã gặp trường hợp 1 site mô tả nhầm hẳn nguyên lý hoạt động (trang có dây thành không dây) cho đúng SKU, phải bỏ dữ liệu site đó và dùng sheet.

### Bước 2 — Hợp nhất + viết lại nội dung (agent làm, không phải code cố định)

Đọc `input.json` + `scraped.json` theo từng `sku`, với mỗi sản phẩm tạo ra 1 object có đủ các field sau, ghi thành mảng ra `tmp/enriched.json`:

```
{ sku, title, brandName, categoryPath: string[] /* root -> lá */,
  shortDescription: string[], description: string /* \n\n giữa đoạn */,
  specifications: [{label, value}], priceInVND, inStock, imagePathFromExcel }
```

- `shortDescription`/`description`: hợp nhất từ các site đã khớp, **viết lại bằng lời riêng** (không copy nguyên văn đoạn văn marketing dài của site khác) — chỉ bảng thông số (`specifications`) là dữ liệu kỹ thuật thuần, giữ nguyên không cần viết lại.
- `specifications`: gộp từ các site đã khớp (loại trùng theo label), luôn đảm bảo có 1 dòng "Bảo hành" (lấy từ `warrantyMonths` trong sheet nếu site chưa có).
- `priceInVND`/`inStock`: ưu tiên giá/tình trạng lấy được từ site đã khớp, **thiếu thì lấy từ `input.json`** (`priceInVNDFromSheet`/`stockStatusTextFromSheet`).
- `categoryPath`: dùng `categoryPath` đã tính sẵn trong `scraped.json` (mặc định root cố định "Thiết bị báo động - báo cháy" > "Thiết bị báo cháy" cho lô PCCC — đổi hằng số `DEFAULT_CATEGORY_ROOT` trong `scrape-by-sku.mjs` nếu dùng cho lô sản phẩm khác loại).
- Làm theo lô ~15-20 sản phẩm/lượt để không quá tải 1 turn, giống pattern skill `import-vuhoang-products`.

### Bước 3 — Nhập vào Payload

```bash
npm run payload -- run .claude/skills/import-products-by-sku/scripts/import.mjs -- --input=.claude/skills/import-products-by-sku/tmp/enriched.json
```

- Category được tạo/tìm theo cây (field `parent`), gán product vào category **lá cuối cùng** trong `categoryPath` — không tạo lại category ở các cấp cha nếu đã tồn tại đúng cấp đó.
- Slug tạo từ `sku` (không phụ thuộc URL nguồn — SKU luôn có sẵn dù không site nào khớp).
- Ảnh lấy từ `imagePathFromExcel`; nếu thiếu ảnh, Products yêu cầu tối thiểu 1 ảnh (`gallery` `minRows: 1`) nên sản phẩm đó sẽ bị **skip + log rõ** để bổ sung ảnh tay sau, không phải lỗi.
- Bỏ qua (skip) nếu Product với `slug` đó đã tồn tại — an toàn để chạy lại.
- Luôn test với `--limit=2` trước, vào `/admin` kiểm tra Category (đúng cây `parent`)/Brand/Media/Product tạo đúng, và vào `/products/[slug]` xem breadcrumb + mô tả + thông số hiển thị đúng, rồi mới chạy full (bỏ `--limit`).

## Tái sử dụng cho lô SKU khác

- Đổi input ở Bước 0 (`--file`/`--sheet` khác) là chạy lại được toàn bộ quy trình cho 1 danh sách SKU hoàn toàn khác, không cần sửa code — trừ khi đổi sang ngành hàng khác thì nên sửa `DEFAULT_CATEGORY_ROOT`/`DEFAULT_BRAND` trong `scrape-by-sku.mjs` (đang mặc định cho lô PCCC HIKFIRE) và cân nhắc thêm/đổi adapter site tham khảo trong `scrape-by-sku.mjs` nếu 3 site hiện tại không còn phù hợp phạm vi sản phẩm.
- `import.mjs` chỉ dùng `getPayload({config})` như skill cũ — deploy/chạy trên server thật thì SSH vào, chạy lại từ Bước 0 trên server đó.
