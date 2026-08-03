import os
import json
import time
import cv2
import numpy as np
from PIL import Image
from simple_lama_inpainting import SimpleLama

MEDIA_DIR = r"d:\PhuGiaCat\src\public\media"
COORDS_PATH = "coords.json"  # {"<ten_anh_khong_duoi>": [x1,y1,x2,y2], ...}
REPORT_PATH = "apply_report.txt"

coords = json.load(open(COORDS_PATH, encoding="utf-8"))
names = sorted(coords.keys())

lama = SimpleLama()

done = []
errors = []
t0 = time.time()

for idx, name in enumerate(names, 1):
    box = coords[name]
    img_path = os.path.join(MEDIA_DIR, f"{name}.jpg")
    try:
        img = cv2.imread(img_path)
        if img is None:
            errors.append((name, "khong doc duoc anh"))
            continue
        h, w = img.shape[:2]
        x1, y1, x2, y2 = box
        x1 = max(0, x1); y1 = max(0, y1)
        x2 = min(w, x2); y2 = min(h, y2)

        mask = np.zeros((h, w), dtype=np.uint8)
        mask[y1:y2, x1:x2] = 255

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        cleaned = lama(Image.fromarray(img_rgb), Image.fromarray(mask))
        cleaned = cleaned.crop((0, 0, w, h))
        cleaned_bgr = cv2.cvtColor(np.array(cleaned), cv2.COLOR_RGB2BGR)

        tmp_path = img_path + ".tmp.jpg"
        cv2.imwrite(tmp_path, cleaned_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
        os.replace(tmp_path, img_path)

        done.append(name)
        print(f"[{idx}/{len(names)}] {name}: OK ({x1},{y1})-({x2},{y2})", flush=True)
    except Exception as e:
        errors.append((name, str(e)))
        print(f"[{idx}/{len(names)}] {name}: LOI - {e}", flush=True)

elapsed = time.time() - t0
with open(REPORT_PATH, "w", encoding="utf-8") as f:
    f.write(f"Tong: {len(names)}\n")
    f.write(f"Da xoa & ghi de: {len(done)}\n")
    f.write(f"Loi: {len(errors)}\n\n")
    for name, err in errors:
        f.write(f"  {name}: {err}\n")

print(f"\nDONE trong {elapsed/60:.1f} phut. OK={len(done)} LOI={len(errors)}", flush=True)
