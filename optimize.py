from PIL import Image
import os

def optimize(path, max_width, quality):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    img = Image.open(path)
    if img.width > max_width:
        ratio = max_width / float(img.width)
        new_height = int(float(img.height) * float(ratio))
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    img.save(path, 'webp', quality=quality)
    print(f"Optimized {path}")

optimize('gorilla-static.webp', 700, 75)
optimize('Logo-transparent.webp', 300, 80)
