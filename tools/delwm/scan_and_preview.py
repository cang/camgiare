import os
import glob
import json
import cv2
import numpy as np

MEDIA_DIR = r"d:\PhuGiaCat\src\public\media"
TEMPLATES_DIR = "templates"
REVIEW_DIR = "media_review"
RESULTS_PATH = "scan_results.json"

SCALES = np.linspace(0.5, 1.6, 45)
CORNER_BAND = 0.4
MARGIN = 20

os.makedirs(REVIEW_DIR, exist_ok=True)

templates = []
for tp in sorted(glob.glob(os.path.join(TEMPLATES_DIR, "*.png"))):
    t = cv2.imread(tp)
    if t is not None:
        templates.append((tp, t.astype(np.float32), t.shape[1], t.shape[0]))

image_paths = sorted(glob.glob(os.path.join(MEDIA_DIR, "*.jpg")))
print(f"{len(image_paths)} anh, {len(templates)} mau", flush=True)

results = {}

for idx, img_path in enumerate(image_paths, 1):
    name = os.path.splitext(os.path.basename(img_path))[0]
    img = cv2.imread(img_path)
    if img is None:
        print(f"[{idx}/{len(image_paths)}] {name}: KHONG DOC DUOC", flush=True)
        continue
    img_color = img.astype(np.float32)
    h, w = img.shape[:2]

    best_score = -1
    best_loc = None
    best_w = best_h = 0
    best_template = None

    for tpath, template_color, tw, th in templates:
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
                best_w, best_h = new_w, new_h
                best_template = tpath

    x1 = max(0, best_loc[0] - MARGIN)
    y1 = max(0, best_loc[1] - MARGIN)
    x2 = min(w, best_loc[0] + best_w + MARGIN)
    y2 = min(h, best_loc[1] + best_h + MARGIN)

    preview = img.copy()
    cv2.rectangle(preview, (x1, y1), (x2, y2), (0, 0, 255), 3)
    cv2.imwrite(os.path.join(REVIEW_DIR, f"{name}.jpg"), preview)

    results[name] = {
        "score": float(best_score),
        "box": [int(x1), int(y1), int(x2), int(y2)],
        "template": os.path.basename(best_template),
        "image_size": [int(w), int(h)],
    }
    print(f"[{idx}/{len(image_paths)}] {name}: score={best_score:.3f}", flush=True)

with open(RESULTS_PATH, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("DONE", flush=True)
