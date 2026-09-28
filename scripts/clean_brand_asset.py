from pathlib import Path
from collections import Counter
from PIL import Image

ASSET = Path("public/brand/freetopia-mark.png")
image = Image.open(ASSET).convert("RGBA")
width, height = image.size
pixels = image.load()

region = []
for y in range(int(height * 0.55), height):
    for x in range(0, int(width * 0.45)):
        region.append(pixels[x, y])

common = Counter(region).most_common(20)
bright = [p for p in region if p[3] > 0 and min(p[:3]) >= 170]
print(f"Asset: {width}x{height}")
print(f"Lower-left opaque pixels: {sum(1 for p in region if p[3] > 0)}")
print(f"Lower-left bright pixels (min RGB >=170): {len(bright)}")
print("Most common lower-left RGBA values:")
for color, count in common:
    print(color, count)
