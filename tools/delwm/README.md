# Xoá watermark VU HOANG TELECOM khỏi ảnh sản phẩm

Bộ công cụ xoá watermark của đối thủ (vuhoangtelecom.vn) khỏi ảnh sản phẩm đã import vào
`d:\PhuGiaCat\src\public\media`. Không tự động 100% — cách dò watermark bằng OpenCV
template matching (`scan_and_preview.py`) **không đủ tin cậy** trên ảnh thật (đã thử: tỉ lệ
đúng chỉ ~1/144 ảnh khi để tự động hoàn toàn). Quy trình dưới đây dùng agent (Claude) xem ảnh
trực tiếp để xác định vị trí — chậm hơn nhưng chính xác, tránh xoá nhầm chi tiết thật trên ảnh
sản phẩm (cổng USB, logo hãng khác...).

## Chuẩn bị

```bash
cd d:\PhuGiaCat\delwm
./venv312/Scripts/python.exe -m pip list   # kiểm tra venv đã có opencv-python, torch, simple-lama-inpainting, Pillow
```

`templates/` chứa vài mẫu watermark đã cắt sẵn (RGB, không cần alpha) — dùng làm điểm khởi đầu
cho bước quét tự động ở Bước 1. Có thể có nhiều mẫu (các biến thể watermark khác nhau).

Luôn chạy python qua venv này (`./venv312/Scripts/python.exe`), và set
`PYTHONIOENCODING=utf-8` khi chạy trên terminal Windows để không lỗi in tiếng Việt.

## Quy trình (mỗi lần có ảnh mới cần xoá watermark)

**Bước 1 — Quét thử bằng OpenCV** (`scan_and_preview.py`)

Quét toàn bộ `public/media/*.jpg`, thử so khớp với mọi mẫu trong `templates/`, lưu:
- `media_review/<tên>.jpg` — ảnh có khoanh đỏ vị trí đoán được
- `scan_results.json` — điểm số + toạ độ box cho từng ảnh

```bash
PYTHONIOENCODING=utf-8 ./venv312/Scripts/python.exe scan_and_preview.py
```

Đừng tin điểm số (score) để tự động quyết định — điểm cao vẫn có thể sai vị trí, điểm thấp vẫn
có thể đúng. Phải xem preview bằng mắt (hoặc nhờ agent xem, xem Bước 2) để phân loại
`correct` / `wrong` / `no_watermark` cho từng ảnh trước khi xoá.

**Bước 2 — Với ảnh bị "wrong": đọc toạ độ trực tiếp bằng agent**

Đây là bước quan trọng nhất, thay thế hoàn toàn cho việc cố sửa thuật toán OpenCV.

1. Tạo danh sách tên ảnh cần đọc lại toạ độ, lưu vào `wrong_list.json` (mảng tên, không có
   đuôi `.jpg`).
2. Chạy `make_grid_previews.py` để vẽ lưới toạ độ (mỗi 50px, có số) lên các ảnh trong
   `wrong_list.json`, lưu vào `grid_review/<tên>.jpg`.
3. Giao cho agent (Claude, qua Task/Agent tool, chia lô ~14 ảnh/agent để chạy song song) mở
   từng ảnh `grid_review/<tên>.jpg`, tìm watermark, đọc số trên lưới, trả về
   `<tên>: x1,y1,x2,y2` (bọc rộng ra 10-15px mỗi chiều). Cách này chính xác hơn nhiều so với
   template matching vì agent "nhìn thấy" watermark thay vì so khớp mù theo màu/hình.
4. Gộp kết quả các agent vào 1 file JSON dạng `{"<tên>": [x1,y1,x2,y2], ...}`.

**Bước 3 — Áp dụng xoá** (`apply_batch_from_coords.py`)

Sửa `COORDS_PATH` trong file trỏ đúng JSON toạ độ vừa gộp, rồi chạy:

```bash
PYTHONIOENCODING=utf-8 ./venv312/Scripts/python.exe apply_batch_from_coords.py
```

Script dùng LaMa inpainting để tô lại vùng watermark, ghi đè trực tiếp file gốc trong
`public/media` (ghi ra `.tmp.jpg` rồi rename để không hỏng file nếu bị ngắt giữa chừng).
**Luôn có bản backup `public/media` trước khi chạy bước này** (copy cả thư mục ra chỗ khác).

**Bước 4 — QA lại sau khi xoá** (`make_qa_crops.py`)

Xoá xong PHẢI kiểm tra lại — kinh nghiệm thực tế: ~56% số ảnh còn sót viền/góc watermark ở lần
xoá đầu vì khung toạ độ hơi chật (đặc biệt phần đầu nhọn icon "V" hay lấn ra ngoài khung chữ).

```bash
PYTHONIOENCODING=utf-8 ./venv312/Scripts/python.exe make_qa_crops.py
```

Cắt vùng xung quanh mỗi box (đệm rộng, zoom 2x) vào `qa_crops/<tên>.jpg`. Giao agent xem lại,
phân loại `clean` / `remnant`. Ảnh nào `remnant`: lấy box cũ, nới rộng thêm ~35px mỗi chiều rồi
chạy lại Bước 3 cho riêng các ảnh đó (apply_batch_from_coords.py chạy đè lên ảnh đã xử lý một
lần vẫn an toàn — chỉ tốn thêm 1 lượt inpainting).

Lặp lại Bước 4 cho tới khi tất cả `clean`.

## Công cụ phụ (xử lý 1 ảnh đơn lẻ, không cần agent)

- `detect_watermark.py <ảnh>` — quét 1 ảnh bằng OpenCV, xuất preview + `<tên>.bbox.txt`.
- `apply_remove.py <ảnh>` [x1 y1 x2 y2] — xoá theo bbox (đọc từ `.bbox.txt` nếu không truyền
  toạ độ tay).

Dùng khi chỉ cần sửa nhanh 1-2 ảnh và tự nhìn ra toạ độ, không cần dàn agent.

## Bài học rút ra

- Không dùng ngưỡng điểm số (score) của OpenCV template matching để tự động quyết định xoá —
  đã kiểm chứng thực tế điểm cao (~0.96) vẫn có thể sai vị trí, điểm thấp vẫn có thể đúng.
- Giới hạn vùng tìm "chỉ gần góc ảnh" (corner band) giúp giảm khớp nhầm vào chi tiết giữa ảnh,
  nhưng không đủ — nhiều watermark thật không nằm sát mép đủ gần theo ngưỡng cứng.
- Cách đáng tin cậy nhất hiện có: cho agent xem ảnh (có lưới toạ độ hỗ trợ đọc số) và tự chỉ ra
  vị trí, thay vì cố hoàn thiện thuật toán computer-vision cổ điển.
- Luôn nới khung rộng hơn mức "vừa đủ" — phần đầu nhọn/viền mờ của icon rất dễ bị cắt sót nếu
  khung quá khít.
- Luôn backup `public/media` trước khi ghi đè hàng loạt.
