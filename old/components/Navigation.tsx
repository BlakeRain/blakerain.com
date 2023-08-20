import React, { FC } from "react";
import Link from "next/link";
import { SiteNavigation } from "../lib/navigation";
import styles from "./Navigation.module.scss";
import Search from "./icons/Search";
import GitHub from "./icons/GitHub";
import DevTo from "./icons/DevTo";
import Rss from "./icons/Rss";
import Mastodon from "./icons/Mastodon";

const trimTrailingSlash = (str: string): string => {
  return str.length > 0 && str.endsWith("/")
    ? str.substring(0, str.length - 1)
    : str;
};

const SiteNavLinks: FC<{ navigation: SiteNavigation[] }> = ({ navigation }) => {
  return (
    <ul className={styles.siteNavigation}>
      {navigation.map((item, index) => {
        return (
          <li key={index.toString()}>
            <Link href={trimTrailingSlash(item.url)}>{item.label}</Link>
          </li>
        );
      })}
    </ul>
  );
};

const SiteNav: FC<{ navigation: SiteNavigation[] }> = ({ navigation }) => {
  return (
    <React.Fragment>
      <Link href="/" className={styles.logo}>
        <img
          src="/media/logo-text.png"
          width={154}
          height={28}
          alt="Blake Rain"
        />
      </Link>
      <SiteNavLinks navigation={navigation} />
    </React.Fragment>
  );
};

const SearchLink: FC = () => {
  return (
    <Link href="/search">
      <Search />
    </Link>
  );
};

const GitHubLink: FC = () => {
  return (
    <a
      href="https://github.com/BlakeRain"
      title="GitHub"
      target="_blank"
      rel="noreferrer"
    >
      <GitHub />
    </a>
  );
};

const MastodonLink: FC = () => {
  return (
    <a
      href="https://mastodonapp.uk/@BlakeRain"
      title="@BlakeRain@mastodonapp.uk"
      target="_blank"
      rel="me noreferrer"
    >
      <Mastodon />
    </a>
  );
};

const DevLink: FC = () => {
  return (
    <a
      href="https://dev.to/blakerain"
      title="blakerain"
      target="_blank"
      rel="noreferrer"
    >
      <DevTo />
    </a>
  );
};

const RssLink: FC = () => {
  return (
    <a href="/feeds/feed.xml" title="RSS feed">
      <Rss />
    </a>
  );
};

const NavigationBar: FC<{ navigation: SiteNavigation[] }> = (props) => {
  return (
    <nav className={styles.navigation}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <SiteNav navigation={props.navigation} />
        </div>
        <div className={styles.right}>
          <ul>
            <li>
              <SearchLink />
            </li>
            <li>
              <GitHubLink />
            </li>
            <li>
              <MastodonLink />
            </li>
            <li>
              <DevLink />
            </li>
            <li>
              <RssLink />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export const Navigation: FC<{ navigation: SiteNavigation[] }> = (props) => {
  return (
    <React.Fragment>
      <NavigationBar {...props} />
    </React.Fragment>
  );
};
