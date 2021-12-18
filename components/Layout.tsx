import Head from "next/head";
import React, { FC } from "react";
import { SiteNavigation } from "../lib/ghost";
import { Footer } from "./Footer";
import styles from "./Layout.module.scss";
import { Navigation } from "./Navigation";

export interface LayoutProps {
  navigation: SiteNavigation[];
}

export const Layout: FC<LayoutProps> = ({ navigation, children }) => {
  return (
    <React.Fragment>
      <Head>
        <meta name="referer" content="no-referrer-when-downgrade" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Navigation navigation={navigation} />
      <div className={styles.content}>
        <div className={styles.inner}>{children}</div>
      </div>
      <Footer />
      <script
        async
        src="https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js"></script>
    </React.Fragment>
  );
};
