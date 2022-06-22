import React, { FC, useEffect, useState } from "react";
import Link from "next/link";
import { SiteNavigation } from "../lib/navigation";
import { SearchContainer } from "./search/SearchContainer";
import { SearchChildProps, SearchProvider } from "./search/SearchProvider";
import styles from "./Navigation.module.scss";
import { useRouter } from "next/router";
import Search from "./icons/Search";
import GitHub from "./icons/GitHub";
import Twitter from "./icons/Twitter";
import DevTo from "./icons/DevTo";
import Rss from "./icons/Rss";

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
            <Link href={trimTrailingSlash(item.url)}>
              <a>{item.label}</a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

const SiteNav: FC<{ navigation: SiteNavigation[] }> = ({ navigation }) => {
  return (
    <React.Fragment>
      <Link href="/">
        <a className={styles.logo}>
          <img
            src="/media/logo-text.png"
            width={154}
            height={28}
            alt="Blake Rain"
          />
        </a>
      </Link>
      <SiteNavLinks navigation={navigation} />
    </React.Fragment>
  );
};

const SearchLink: FC<{ onSearchClick: () => void }> = ({ onSearchClick }) => {
  return (
    <a
      href="#"
      title="Search"
      onClick={(event) => {
        event.preventDefault();
        if (onSearchClick) {
          onSearchClick();
        }
      }}
    >
      <Search />
    </a>
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

const TwitterLink: FC = () => {
  return (
    <a
      href="https://twitter.com/HalfWayMan"
      title="Twitter"
      target="_blank"
      rel="noreferrer"
    >
      <Twitter />
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

export interface HighlightRefresh {
  counter: number;
  increment: () => void;
}

const SearchNavigation: FC<{ terms?: string }> = ({ terms }) => {
  const router = useRouter();
  const [marks, setMarks] = useState<HTMLElement[]>([]);
  const [current, setCurrent] = useState<number>(-1);

  const highlightMark = (element: HTMLElement) => {
    element.className = "active";
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const focusMark = (index: number) => {
    if (current >= 0) {
      marks[current].className = "";
    }

    highlightMark(marks[index]);
    setCurrent(index);
  };

  const findMarks = (firstTime: boolean) => {
    const found = Array.prototype.slice.call(document.querySelectorAll("mark"));

    setMarks(found);
    if (firstTime && found.length > 0) {
      highlightMark(found[0]);
      setCurrent(0);
    } else {
      if (current >= found.length) {
        setCurrent(found.length > 0 ? marks.length - 1 : -1);
      }
    }
  };

  useEffect(() => {
    window.setTimeout(() => {
      findMarks(true);
    }, 150);
  }, [router.asPath, terms]);

  const gotoNext: React.MouseEventHandler<HTMLButtonElement> = () => {
    findMarks(false);

    if (current < marks.length - 1) {
      focusMark(current + 1);
    }
  };

  const gotoPrev: React.MouseEventHandler<HTMLButtonElement> = () => {
    findMarks(false);

    if (current > 0) {
      focusMark(current - 1);
    }
  };

  const clearHighlight: React.MouseEventHandler<HTMLButtonElement> = () => {
    router.replace(location.pathname);
  };

  if (marks.length === 0) {
    return null;
  }

  return (
    <div className={styles.highlightControls}>
      <div>
        {1 + current} of {marks.length} matching terms
      </div>
      <button type="button" disabled={current === 0} onClick={gotoPrev}>
        &uarr; Previous
      </button>
      <button
        type="button"
        disabled={current === marks.length - 1}
        onClick={gotoNext}
      >
        &darr; Next
      </button>
      <button type="button" onClick={clearHighlight}>
        Clear
      </button>
    </div>
  );
};

const NavigationBar: FC<SearchChildProps & { navigation: SiteNavigation[] }> = (
  props
) => {
  return (
    <nav className={styles.navigation}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <SiteNav navigation={props.navigation} />
        </div>
        <div className={styles.right}>
          <ul>
            <li>
              <SearchLink
                onSearchClick={() => {
                  props.setSearchVisible(!props.searchVisible);
                }}
              />
            </li>
            <li>
              <GitHubLink />
            </li>
            <li>
              <TwitterLink />
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

const NavigationInner: FC<
  SearchChildProps & { navigation: SiteNavigation[] }
> = (props) => {
  const router = useRouter();
  const highlight = router.query["highlight"];
  const terms = typeof highlight === "string" ? highlight : undefined;

  return (
    <React.Fragment>
      <NavigationBar {...props} />
      <SearchNavigation terms={terms} />
      <SearchContainer {...props} />
    </React.Fragment>
  );
};

export const Navigation: FC<{ navigation: SiteNavigation[] }> = (props) => {
  return <SearchProvider child={NavigationInner} childProps={props} />;
};
