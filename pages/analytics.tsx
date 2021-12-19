import React, { FC, useState } from "react";
import { Layout } from "../components/Layout";
import { GetStaticProps } from "next";
import Head from "next/head";
import { getSiteSettings, SiteNavigation } from "../lib/ghost";
import { authenticate } from "../lib/analytics";
import styles from "./analytics.module.scss";

const SignIn: FC<{ setToken: (token: string) => void }> = ({ setToken }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = username.length > 1 && password.length > 1;

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setError(null);
    setProcessing(true);
    authenticate(username, password)
      .then((token) => setToken(token))
      .catch((err) => {
        console.log("Sign in API error", err, typeof err);
        setProcessing(false);
        setError(err);
      });
  };

  const handleUsernameChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setPassword(event.target.value);
  };

  return (
    <div className={styles.signInFormContainer}>
      <form
        className={styles.signInForm}
        noValidate
        autoComplete="off"
        onSubmit={handleFormSubmit}
      >
        <div className={styles.field}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            disabled={processing}
            value={username}
            onChange={handleUsernameChange}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            disabled={processing}
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <div className={styles.error}>{error || " "}</div>
        <button type="submit" disabled={!canSubmit || processing}>
          Sign In
        </button>
      </form>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const settings = await getSiteSettings();

  return {
    props: {
      navigation: settings.navigation,
    },
  };
};

const Analytics: FC<{ navigation: SiteNavigation[] }> = ({ navigation }) => {
  const [token, setToken] = useState<string | null>(null);

  return (
    <Layout navigation={navigation}>
      <Head>
        <title>Site Analytics</title>
      </Head>
      {token ? <b>Okay</b> : <SignIn setToken={setToken} />}
    </Layout>
  );
};

export default Analytics;
