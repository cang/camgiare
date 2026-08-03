import sys
import os
import cv2
import numpy as np
from PIL import Image
from simple_lama_inpainting import SimpleLama

# ================== CẤU HÌNH ==================
# Cách dùng:
#   python apply_remove.py <image_path>                        -> đọc bbox từ <ten_anh>.bbox.txt
#   python apply_remove.py <image_path> x1 y1 x2 y2             -> dùng bbox truyền tay
IMAGE_PATH = sys.argv[1] if len(sys.argv) > 1 else "image.png"

name = os.path.splitext(os.path.basename(IMAGE_PATH))[0]
OUTPUT_PATH = f"ket_qua_{name}.jpg"
BBOX_PATH = f"{name}.bbox.txt"
# ==============================================

if len(sys.argv) >= 6:
    x1, y1, x2, y2 = map(int, sys.argv[2:6])
else:
    if not os.path.exists(BBOX_PATH):
        raise FileNotFoundError(
            f"Không có {BBOX_PATH} — chạy detect_watermark.py {IMAGE_PATH} trước, "
            f"hoặc truyền tay: python apply_remove.py {IMAGE_PATH} x1 y1 x2 y2"
        )
    with open(BBOX_PATH) as f:
        x1, y1, x2, y2 = map(int, f.read().strip().split(","))

img = cv2.imread(IMAGE_PATH)
if img is None:
    raise FileNotFoundError(f"Thiếu {IMAGE_PATH}")

h, w = img.shape[:2]
x1, y1 = max(0, x1), max(0, y1)
x2, y2 = min(w, x2), min(h, y2)

print(f"Vùng xoá: ({x1}, {y1}) - ({x2}, {y2})")

mask = np.zeros((h, w), dtype=np.uint8)
mask[y1:y2, x1:x2] = 255

print("Đang xoá watermark và tô lại nền (LaMa inpainting)...")
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
lama = SimpleLama()
cleaned = lama(Image.fromarray(img_rgb), Image.fromarray(mask))
cleaned = cleaned.crop((0, 0, w, h))  # SimpleLama đệm ảnh lên bội số của 8, cắt lại đúng kích thước gốc
cleaned_bgr = cv2.cvtColor(np.array(cleaned), cv2.COLOR_RGB2BGR)

cv2.imwrite(OUTPUT_PATH, cleaned_bgr)
print(f"\n✔ Đã lưu kết quả vào: {OUTPUT_PATH}")
