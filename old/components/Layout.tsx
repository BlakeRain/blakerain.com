import Head from "next/head";
import React, { FC } from "react";
import { SiteNavigation } from "../lib/navigation";
import { Footer } from "./Footer";
import styles from "./Layout.module.scss";
import { Navigation } from "./Navigation";

export interface LayoutProps {
  navigation: SiteNavigation[];
  wrap?: boolean;
}

export const Layout: FC<React.PropsWithChildren<LayoutProps>> = ({
  navigation,
  children,
  wrap,
}) => {
  return (
    <React.Fragment>
      <Head>
        <meta name="referer" content="no-referrer-when-downgrade" />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#12304c" />
        <meta name="msapplication-TileColor" content="#12304e" />
        <meta name="theme-color" content="#12304e" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Blake Rain",
              url: "https://blakerain.com",
            }),
          }}
        />
      </Head>
      <Navigation navigation={navigation} />
      {wrap ? (
        <div className={styles.outer}>
          <div className={styles.inner}>{children}</div>
        </div>
      ) : (
        children
      )}
      <Footer />
    </React.Fragment>
  );
};