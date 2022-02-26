const fs = require("fs").promises;
const sharp = require("sharp");
const path = require("path");

const baseDir = path.join(process.cwd(), "public", "content");
const outDir = path.join(process.cwd(), "out", "content");

const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384];
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const QUALITY = 75;

function isImageExtension(extension) {
  return [".jpg", ".jpeg", ".webp", ".png", ".avif"].includes(extension);
}

async function scanDirectory(dir, info) {
  info.directories.push(dir);
  for (let image_filename of await fs.readdir(path.join(baseDir, dir))) {
    const image_path = path.join(baseDir, dir, image_filename);
    const image_stat = await fs.stat(image_path);

    if (image_stat.isDirectory()) {
      await scanDirectory(path.join(dir, image_filename), info);
    } else if (image_stat.isFile()) {
      const image_ext = path.extname(image_filename);
      if (isImageExtension(image_ext)) {
        info.images.push({
          relative: path.join(dir, image_filename),
          directory: dir,
          filename: image_filename,
          basename: path.basename(image_filename, image_ext),
          extension: image_ext,
        });
      }
    }
  }
}

async function main() {
  console.log("Image optimization process");

  const info = { directories: [], images: [] };
  await scanDirectory("", info);

  // Create the optimized output directories
  for (let directory of info.directories) {
    const opt_dir = path.join(outDir, directory, "optimized");
    await fs.mkdir(opt_dir, { recursive: true });
  }

  const widths = [...IMAGE_SIZES, ...DEVICE_SIZES];
  let total = 0;

  console.log(
    `Processing ${info.images.length} image(s) over ${widths.length} size(s) ...`
  );
  for (let image of info.images) {
    const image_buf = await fs.readFile(path.join(baseDir, image.relative));

    for (let width_idx = 0; width_idx < widths.length; ++width_idx) {
      const width = widths[width_idx];
      const out_path = path.join(
        outDir,
        image.directory,
        "optimized",
        `${image.basename}-opt-${width}.webp`
      );

      const transformer = sharp(image_buf);
      await transformer.rotate();
      const { width: metaWidth } = await transformer.metadata();

      if (metaWidth && metaWidth > width) {
        transformer.resize(width);
      }

      if (image.extension === "avif") {
        if (transformer.avif) {
          const avif_quality = QUALITY - 15;
          transformer.avif({
            quality: Math.max(avif_quality, 0),
            chromaSubsampling: "4:2:0",
          });
        } else {
          transformer.webp({ quality: QUALITY });
        }
      } else {
        transformer.webp({ quality: QUALITY });
      }

      const info = await transformer.toFile(out_path);
      total += info.size;
    }
  }

  console.log(
    `Generated ${(total / (1024 * 1024)).toFixed(2)} Mib of optimized images`
  );
}

main();
