import os
import json
import cv2

MEDIA_DIR = r"d:\PhuGiaCat\src\public\media"
QA_DIR = "qa_crops"
PAD = 60

os.makedirs(QA_DIR, exist_ok=True)
coords = json.load(open("coords.json", encoding="utf-8"))

for name, box in coords.items():
    img_path = os.path.join(MEDIA_DIR, f"{name}.jpg")
    img = cv2.imread(img_path)
    if img is None:
        print(f"{name}: KHONG DOC DUOC")
        continue
    h, w = img.shape[:2]
    x1, y1, x2, y2 = box
    cx1 = max(0, x1 - PAD)
    cy1 = max(0, y1 - PAD)
    cx2 = min(w, x2 + PAD)
    cy2 = min(h, y2 + PAD)
    crop = img[cy1:cy2, cx1:cx2]
    crop = cv2.resize(crop, (crop.shape[1] * 2, crop.shape[0] * 2), interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(os.path.join(QA_DIR, f"{name}.jpg"), crop)

print(f"Done: {len(coords)} QA crops in {QA_DIR}/")
