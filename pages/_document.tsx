import { Head, Html, Main, NextScript } from "next/document";

const FONTS = {
  Roboto: [100, 300, 400, 500, 700],
  "Noto Serif": [400, 700],
  "Source Code Pro": [400, 700],
};

const weights = (family: keyof typeof FONTS, italic: boolean) =>
  FONTS[family]
    .map((weight: number) => `${italic ? "1" : "0"},${weight}`)
    .join(";");

const FAMILIES = (Object.keys(FONTS) as (keyof typeof FONTS)[])
  .map(
    (family) =>
      `family=${family.replace(" ", "+")}:ital,wght@${weights(
        family,
        false
      )};${weights(family, true)}`
  )
  .join("&");

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          href={`https://fonts.googleapis.com/css2?${FAMILIES}&display=swap`}
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
