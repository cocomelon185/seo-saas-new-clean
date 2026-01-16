from pathlib import Path
import base64

img_dir = Path("src/assets/img")
img_dir.mkdir(parents=True, exist_ok=True)

# 1x1 PNG (transparent)
PNG_1x1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axu2K8AAAAASUVORK5CYII="
)

# tiny JPG (1x1)
JPG_1x1 = base64.b64decode(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAaABoBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAHnAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCIf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8BIf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8BIf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8CIf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hIf/Z"
)

def write_png(name: str):
    (img_dir / name).write_bytes(PNG_1x1)

def write_jpg(name: str):
    (img_dir / name).write_bytes(JPG_1x1)

def write_svg(name: str):
    (img_dir / name).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#e2e8f0"/></svg>')

# Files Vite warned about (create placeholders)
pngs = [
  "register_bg_2.png",
  "pattern_react.png",
  "component-btn.png",
  "component-profile-card.png",
  "component-info-card.png",
  "component-info-2.png",
  "component-menu.png",
  "component-btn-pink.png",
  "documentation.png",
  "team-4-470x470.png",
]
jpgs = [
  "login.jpg",
  "profile.jpg",
  "landing.jpg",
  "team-1-800x800.jpg",
  "team-2-800x800.jpg",
  "team-3-800x800.jpg",
  "bootstrap.jpg",
  "angular.jpg",
  "sketch.jpg",
  "react.jpg",
  "vue.jpg",
]
svgs = ["github.svg", "google.svg"]

for f in pngs: write_png(f)
for f in jpgs: write_jpg(f)
for f in svgs: write_svg(f)

print("✅ Created placeholder assets in src/assets/img/")
