import React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Analytics from "../../components/Analytics";
import { Layout } from "../../components/Layout";
import { loadNavigation, SiteNavigation } from "../../lib/utils";
import Grid from "../../components/Grid";
import { AccountProvider } from "../../components/tools/AccountProvider";
import AccountInfoPanel from "../../components/tools/panels/AccountInfo";
import { PositionProvider } from "../../components/tools/PositionProvider";
import { PositionInfoPanel } from "../../components/tools/panels/PositionInfo";
import PositionSizePanel from "../../components/tools/panels/PositionSizePanel";
import styles from "./position-size.module.scss";

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
