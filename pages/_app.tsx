import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

import "normalize.css";
import "../styles/global.scss";
import "../styles/code.scss";

import SEO from "../next-seo.config.js";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultSeo {...SEO} />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
