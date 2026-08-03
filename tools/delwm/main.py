import cv2
import numpy as np
from PIL import Image
from simple_lama_inpainting import SimpleLama

# ================== CẤU HÌNH ==================
IMAGE_PATH = "image.png"                     # ảnh gốc
TEMPLATE_PATH = "watermark_template.png"     # logo bạn cắt
OUTPUT_PATH = "ket_qua_xoa_watermark.jpg"

# Phạm vi scale (từ 50% đến 150%)
SCALES = np.linspace(0.5, 1.5, 31)
THRESHOLD = 0.60          # độ chính xác tối thiểu
MARGIN = 15               # nới rộng mask (pixel)
# ==============================================

img = cv2.imread(IMAGE_PATH)
template = cv2.imread(TEMPLATE_PATH)

if img is None or template is None:
    raise FileNotFoundError("Không tìm thấy image.png hoặc watermark_template.png")

img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

h, w = img_gray.shape
th, tw = template_gray.shape

best_score = -1
best_loc = None
best_scale = 1.0
best_w, best_h = tw, th

print("Đang quét watermark với nhiều kích thước...")

for scale in SCALES:
    new_w = int(tw * scale)
    new_h = int(th * scale)

    if new_w < 15 or new_h < 15 or new_w >= w or new_h >= h:
        continue

    resized = cv2.resize(template_gray, (new_w, new_h), interpolation=cv2.INTER_AREA)
    result = cv2.matchTemplate(img_gray, resized, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(result)

    if max_val > best_score:
        best_score = max_val
        best_loc = max_loc
        best_scale = scale
        best_w, best_h = new_w, new_h

print(f"\nKết quả tìm kiếm:")
print(f"  Độ chính xác : {best_score:.3f}")
print(f"  Tỷ lệ scale  : {best_scale:.2f}")
print(f"  Vị trí       : {best_loc}")
print(f"  Kích thước   : {best_w} x {best_h}")

if best_score < THRESHOLD:
    print("\n⚠ Không tìm thấy watermark đủ tin cậy.")
    print("→ Hãy cắt template sạch hơn (chỉ lấy logo, bỏ nền thừa).")
    exit()

# Tạo mask (vùng trắng = nơi cần xoá / tô lại)
x1 = max(0, best_loc[0] - MARGIN)
y1 = max(0, best_loc[1] - MARGIN)
x2 = min(w, best_loc[0] + best_w + MARGIN)
y2 = min(h, best_loc[1] + best_h + MARGIN)

mask = np.zeros((h, w), dtype=np.uint8)
mask[y1:y2, x1:x2] = 255

print("\nĐang tô lại vùng watermark bằng LaMa inpainting (có thể mất chút thời gian)...")

img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
lama = SimpleLama()
result = lama(Image.fromarray(img_rgb), Image.fromarray(mask))

result_bgr = cv2.cvtColor(np.array(result), cv2.COLOR_RGB2BGR)
cv2.imwrite(OUTPUT_PATH, result_bgr)

print(f"\n✔ Đã lưu kết quả vào: {OUTPUT_PATH}")
