from pathlib import Path
from PIL import Image
from collections import deque

ASSET = Path("public/brand/freetopia-mark.png")

def is_outer_white(pixel):
    r, g, b, a = pixel
    return a > 0 and r >= 235 and g >= 235 and b >= 235

image = Image.open(ASSET).convert("RGBA")
pixels = image.load()
width, height = image.size

seen = bytearray(width * height)
queue = deque()

def enqueue(x, y):
    index = y * width + x
    if not seen[index] and is_outer_white(pixels[x, y]):
        seen[index] = 1
        queue.append((x, y))

for x in range(width):
    enqueue(x, 0)
    enqueue(x, height - 1)

for y in range(height):
    enqueue(0, y)
    enqueue(width - 1, y)

while queue:
    x, y = queue.popleft()
    pixels[x, y] = (pixels[x, y][0], pixels[x, y][1], pixels[x, y][2], 0)
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < width and 0 <= ny < height:
            enqueue(nx, ny)

image.save(ASSET, "PNG", optimize=True)
print(f"Cleaned {ASSET} ({width}x{height})")
