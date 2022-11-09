import React, { useState } from "react";
import path from "path";
import NextImage, { ImageProps } from "next/image";

interface SplitFilePath {
  dir: string;
  filename: string;
  extension: string;
}

const splitFilePath: (file_path: string) => SplitFilePath = (file_path) => {
  return {
    dir: path.dirname(file_path),
    filename: path.basename(file_path),
    extension: path.extname(file_path),
  };
};

const isImageExtension: (extension: string) => Boolean = (extension) => {
  return [".jpg", ".jpeg", ".webp", ".png", ".avif"].includes(
    extension.toLowerCase()
  );
};

const customLoader: (props: { src: string; width: number }) => string = ({
  src,
  width,
}) => {
  const { dir, filename, extension } = splitFilePath(src);
  if (!isImageExtension(extension)) {
    // The image has an unsupported extension
    return src;
  }

  // We are going to use WEBP for all image formats
  let target_ext = extension;
  if (target_ext.toLowerCase() != ".webp") {
    target_ext = ".webp";
  }

  const target = path.join(
    dir,
    "optimized",
    `${path.basename(filename, extension)}-opt-${width}${target_ext}`
  );

  return target;
};

export default function Image(props: ImageProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const { src, ...rest } = props;

  return (
    <NextImage
      {...rest}
      loader={imageError ? ({ src }) => src : customLoader}
      src={src}
      onError={() => {
        setImageError(true);
      }}
    />
  );
}
