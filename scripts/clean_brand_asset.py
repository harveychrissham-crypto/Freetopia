from pathlib import Path
from PIL import Image
from collections import deque

ASSET = Path("public/brand/freetopia-mark.png")

def is_white(pixel):
    r, g, b, a = pixel
    return a > 0 and r >= 225 and g >= 225 and b >= 225

image = Image.open(ASSET).convert("RGBA")
pixels = image.load()
width, height = image.size

# First remove white regions that touch the outside edge.
seen = bytearray(width * height)
queue = deque()

def enqueue(x, y):
    index = y * width + x
    if not seen[index] and is_white(pixels[x, y]):
        seen[index] = 1
        queue.append((x, y))

for x in range(width):
    enqueue(x, 0)
    enqueue(x, height - 1)

for y in range(height):
    enqueue(0, y)
    enqueue(width - 1, y)

removed_edge = 0
while queue:
    x, y = queue.popleft()
    if pixels[x, y][3]:
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        removed_edge += 1
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < width and 0 <= ny < height:
            enqueue(nx, ny)

# The launcher screenshot shows an additional white crescent/spill
# inside the lower-left corner. Remove only near-white pixels in that
# localized area; the main F mark is above/inside this region.
removed_corner = 0
for y in range(int(height * 0.58), height):
    for x in range(0, int(width * 0.40)):
        r, g, b, a = pixels[x, y]
        if a > 0 and r >= 225 and g >= 225 and b >= 225:
            pixels[x, y] = (r, g, b, 0)
            removed_corner += 1

image.save(ASSET, "PNG", optimize=True)
print(f"Cleaned {ASSET} ({width}x{height}); edge={removed_edge}, lower_left={removed_corner}")
