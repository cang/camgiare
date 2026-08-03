import os
import json
import cv2
import numpy as np

MEDIA_DIR = r"d:\PhuGiaCat\src\public\media"
GRID_DIR = "grid_review"
STEP = 50  # khoảng cách lưới (px)

os.makedirs(GRID_DIR, exist_ok=True)
names = json.load(open("wrong_list.json"))

for name in names:
    img_path = os.path.join(MEDIA_DIR, f"{name}.jpg")
    img = cv2.imread(img_path)
    if img is None:
        print(f"{name}: KHONG DOC DUOC")
        continue
    h, w = img.shape[:2]
    out = img.copy()

    for x in range(0, w, STEP):
        cv2.line(out, (x, 0), (x, h), (0, 255, 0), 1)
        cv2.putText(out, str(x), (x + 2, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1, cv2.LINE_AA)
    for y in range(0, h, STEP):
        cv2.line(out, (0, y), (w, y), (0, 255, 0), 1)
        cv2.putText(out, str(y), (2, y + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1, cv2.LINE_AA)

    cv2.imwrite(os.path.join(GRID_DIR, f"{name}.jpg"), out)

print(f"Done: {len(names)} grid previews in {GRID_DIR}/")
