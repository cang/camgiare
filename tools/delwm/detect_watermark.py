import sys
import os
import glob
import cv2
import numpy as np

# ================== CẤU HÌNH ==================
IMAGE_PATH = sys.argv[1] if len(sys.argv) > 1 else "image.png"
TEMPLATES_DIR = "templates"   # chứa nhiều mẫu watermark (bổ sung dần khi gặp biến thể mới)

SCALES = np.linspace(0.5, 1.6, 45)
CORNER_BAND = 0.4  # watermark luôn nằm sát một góc ảnh — chỉ tìm trong dải này
# ==============================================

name = os.path.splitext(os.path.basename(IMAGE_PATH))[0]
PREVIEW_PATH = f"preview_{name}.jpg"
BBOX_PATH = f"{name}.bbox.txt"

img = cv2.imread(IMAGE_PATH)
if img is None:
    raise FileNotFoundError(f"Thiếu {IMAGE_PATH}")

template_paths = sorted(glob.glob(os.path.join(TEMPLATES_DIR, "*.png")))
if not template_paths:
    raise FileNotFoundError(f"Không có mẫu watermark nào trong thư mục {TEMPLATES_DIR}/")

img_color = img.astype(np.float32)
h, w = img.shape[:2]

best_score = -1
best_loc = None
best_scale = 1.0
best_w, best_h = 0, 0
best_template = None

print(f"Đang quét vị trí watermark trong {IMAGE_PATH} — thử {len(template_paths)} mẫu trong {TEMPLATES_DIR}/ (chỉ xét vùng sát góc ảnh)...")

for tpath in template_paths:
    template = cv2.imread(tpath)
    if template is None:
        continue
    template_color = template.astype(np.float32)
    th, tw = template.shape[:2]

    for scale in SCALES:
        new_w = int(tw * scale)
        new_h = int(th * scale)
        if new_w < 15 or new_h < 15 or new_w >= w or new_h >= h:
            continue

        resized = cv2.resize(template_color, (new_w, new_h), interpolation=cv2.INTER_AREA)
        result = cv2.matchTemplate(img_color, resized, cv2.TM_CCOEFF_NORMED)

        res_h, res_w = result.shape
        xs = np.arange(res_w)
        ys = np.arange(res_h)
        near_x_edge = (xs < res_w * CORNER_BAND) | (xs + new_w > w - w * CORNER_BAND)
        near_y_edge = (ys < res_h * CORNER_BAND) | (ys + new_h > h - h * CORNER_BAND)
        corner_mask = near_y_edge[:, None] & near_x_edge[None, :]
        result = np.where(corner_mask, result, -1.0)

        _, max_val, _, max_loc = cv2.minMaxLoc(result)

        if max_val > best_score:
            best_score = max_val
            best_loc = max_loc
            best_scale = scale
            best_w, best_h = new_w, new_h
            best_template = tpath

MARGIN = 20
x1 = max(0, best_loc[0] - MARGIN)
y1 = max(0, best_loc[1] - MARGIN)
x2 = min(w, best_loc[0] + best_w + MARGIN)
y2 = min(h, best_loc[1] + best_h + MARGIN)

print(f"\nKết quả tìm kiếm:")
print(f"  Mẫu khớp nhất    : {best_template}")
print(f"  Độ khớp          : {best_score:.3f}")
print(f"  Tỷ lệ scale      : {best_scale:.2f}")
print(f"  Vùng (có margin) : ({x1}, {y1}) - ({x2}, {y2})")

preview = img.copy()
cv2.rectangle(preview, (x1, y1), (x2, y2), (0, 0, 255), 3)
cv2.imwrite(PREVIEW_PATH, preview)

with open(BBOX_PATH, "w") as f:
    f.write(f"{x1},{y1},{x2},{y2}\n")

print(f"\n✔ Đã lưu ảnh xem trước (có khoanh vùng đỏ): {PREVIEW_PATH}")
print(f"✔ Đã lưu toạ độ vùng: {BBOX_PATH}")
print("→ Mở ảnh preview kiểm tra. Nếu khung đỏ SAI vị trí, sửa 4 số trong file .bbox.txt (x1,y1,x2,y2) rồi chạy apply_swap.py.")
print("→ Nếu khung ĐÚNG và đây là 1 kiểu watermark mới, có thể crop lại vùng đó lưu thêm vào templates/ để lần sau khớp tốt hơn.")
