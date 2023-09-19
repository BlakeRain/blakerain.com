const fs = require("fs").promises;
const path = require("path");
const swc = require("@swc/core");
const minify_html = require("html-minifier").minify;

async function load_swc_config() {
  try {
    const content = await fs.readFile(
      path.join(process.env.TRUNK_SOURCE_DIR, ".swcrc"),
      "utf8"
    );

    return JSON.parse(content);
  } catch (err) {
    console.log(`Error reading file from disk: ${err}`);
  }
}

async function* find_files(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);

    if (dirent.isDirectory()) {
      yield* find_files(res);
    } else {
      yield res;
    }
  }
}

async function min_js(filepath) {
  const swc_config = await load_swc_config();
  const output = await swc.transformFile(filepath, swc_config, swc_config);
  await fs.writeFile(filepath, output.code);
  return output.code.length;
}

async function min_html(filepath) {
  const content = await fs.readFile(filepath, "utf8");
  const output = minify_html(content, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    decodeEntities: true,
    html5: true,
    minifyCSS: false,
    minifyJS: true,
    processConditionalComments: true,
    removeAttributeQuotes: false,
    removeComments: true,
    removeEmptyAttributes: true,
    removeOptionalTags: false,
    removeRedundantAttributes: true,
    sortAttributes: true,
    sortClassName: true,
    trimCustomFragments: true,
  });
  await fs.writeFile(filepath, output);
  return output.length;
}

const format = new Intl.NumberFormat();
function fmt(number) {
  return format.format(number);
}

async function minify_javascript() {
  console.log("Minifying HTML and JavaScript ...");

  const staging_dir = process.env.TRUNK_STAGING_DIR;

  for await (const filepath of find_files(staging_dir)) {
    const minifier = filepath.endsWith(".js")
      ? min_js
      : filepath.endsWith(".html")
      ? min_html
      : null;

    if (!minifier) {
      continue;
    }

    console.log("  Minifying " + path.basename(filepath));
    const size_before = (await fs.stat(filepath)).size;
    const size_after = await minifier(filepath);
    const delta = size_before - size_after;
    const percent = (delta / size_before) * 100;
    console.log(
      `    From ${fmt(size_before)} bytes to ${fmt(
        size_after
      )} bytes saving ${fmt(delta)} bytes (${percent.toFixed(2)}%)`
    );
  }
}

async function main() {
  if (process.env.TRUNK_PROFILE == "release") {
    await minify_javascript();
  }
}

main().then(() => {});
