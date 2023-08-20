import React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Analytics from "../../components/Analytics";
import { Layout } from "../../components/Layout";
import { loadNavigation, SiteNavigation } from "../../lib/navigation";
import Grid from "../../components/display/Grid";
import { AccountProvider } from "../../components/tools/position-size/AccountProvider";
import AccountInfoPanel from "../../components/tools/position-size/panels/AccountInfo";
import { PositionProvider } from "../../components/tools/position-size/PositionProvider";
import { PositionInfoPanel } from "../../components/tools/position-size/panels/PositionInfo";
import PositionSizePanel from "../../components/tools/position-size/panels/PositionSizePanel";
import styles from "./position-size.module.scss";
import { NextSeo } from "next-seo";

export const getStaticProps: GetStaticProps = async () => {
  const navigation = await loadNavigation();

  return {
    props: {
      navigation,
    },
  };
};

const PositionSize: NextPage<{ navigation: SiteNavigation[] }> = ({
  navigation,
}) => {
  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>Position Size Calculator</title>
      </Head>
      <NextSeo noindex nofollow />
      <Analytics />
      <AccountProvider>
        <PositionProvider>
          <Grid className={styles.grid} columnGap={2} mt={2} mb={2}>
            <AccountInfoPanel />
            <PositionInfoPanel />
          </Grid>
          <PositionSizePanel />
        </PositionProvider>
      </AccountProvider>
    </Layout>
  );
};

export default PositionSize;
