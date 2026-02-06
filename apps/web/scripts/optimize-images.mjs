import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "src", "assets", "landing-src");
const outDir = path.join(root, "public", "landing");

const images = [
  {
    name: "feature-audit",
    ext: "png",
    width: 1600,
    height: 1200,
    fit: "cover"
  },
  {
    name: "feature-priorities",
    ext: "png",
    width: 1600,
    height: 1200,
    fit: "cover"
  },
  {
    name: "feature-report",
    ext: "png",
    width: 1600,
    height: 1200,
    fit: "cover"
  },
  {
    name: "illustration-audit",
    ext: "png",
    width: 900,
    height: 900,
    fit: "contain",
    background: "#ffffff"
  },
  {
    name: "illustration-priorities",
    ext: "png",
    width: 900,
    height: 900,
    fit: "contain",
    background: "#ffffff"
  },
  {
    name: "illustration-report",
    ext: "png",
    width: 900,
    height: 900,
    fit: "contain",
    background: "#ffffff"
  },
  {
    name: "audience-bloggers",
    ext: "jpg",
    width: 1600,
    height: 900,
    fit: "cover"
  },
  {
    name: "audience-smallbiz",
    ext: "jpg",
    width: 1600,
    height: 900,
    fit: "cover"
  },
  {
    name: "audience-agencies",
    ext: "jpg",
    width: 1600,
    height: 900,
    fit: "cover"
  }
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function processImage(item, warnMissing = false) {
  const inputPath = path.join(sourceDir, `${item.name}.${item.ext}`);
  const outputPath = path.join(outDir, `${item.name}.png`);
  const output2xPath = path.join(outDir, `${item.name}@2x.png`);
  const webpPath = path.join(outDir, `${item.name}.webp`);
  const webp2xPath = path.join(outDir, `${item.name}@2x.webp`);

  if (!(await fileExists(inputPath))) {
    if (warnMissing) {
      console.warn(`[skip] Missing ${inputPath}`);
    }
    return false;
  }

  const pipeline = sharp(inputPath, { failOn: "none" })
    .resize({
      width: item.width,
      height: item.height,
      fit: item.fit,
      position: "attention",
      background: item.background || "#ffffff"
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true });

  await pipeline.toFile(outputPath);

  const pipeline2x = sharp(inputPath, { failOn: "none" })
    .resize({
      width: item.width * 2,
      height: item.height * 2,
      fit: item.fit,
      position: "attention",
      background: item.background || "#ffffff"
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true });

  await pipeline2x.toFile(output2xPath);

  const webp = sharp(inputPath, { failOn: "none" })
    .resize({
      width: item.width,
      height: item.height,
      fit: item.fit,
      position: "attention",
      background: item.background || "#ffffff"
    })
    .webp({ quality: 82 });

  await webp.toFile(webpPath);

  const webp2x = sharp(inputPath, { failOn: "none" })
    .resize({
      width: item.width * 2,
      height: item.height * 2,
      fit: item.fit,
      position: "attention",
      background: item.background || "#ffffff"
    })
    .webp({ quality: 78 });

  await webp2x.toFile(webp2xPath);
  return true;
}

async function main() {
  if (!(await dirExists(sourceDir))) {
    console.log("No landing-src images found. Skipping optional image optimization.");
    return;
  }

  await ensureDir(outDir);
  let processed = 0;
  let missing = 0;
  for (const item of images) {
    const ok = await processImage(item, false);
    if (ok) {
      processed += 1;
    } else {
      missing += 1;
    }
  }
  if (processed === 0) {
    console.log("No landing-src images matched. Skipping optional image optimization.");
  } else if (missing > 0) {
    console.log(`Optimized ${processed} image(s); ${missing} missing.`);
  }
  console.log("Image optimization complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
