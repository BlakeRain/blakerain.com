import React, { FC } from "react";
import { Layout } from "../components/Layout";
import { GetStaticProps } from "next";
import Head from "next/head";
import { getSiteSettings, SiteNavigation } from "../lib/ghost";

export const getStaticProps: GetStaticProps = async (context) => {
  const settings = await getSiteSettings();

  return {
    props: {
      navigation: settings.navigation,
    },
  };
};

const Analytics: FC<{ navigation: SiteNavigation[] }> = ({ navigation }) => {
  return (
    <Layout navigation={navigation}>
      <Head>
        <title>Site Analytics</title>
      </Head>
    </Layout>
  );
};

export default Analytics;
