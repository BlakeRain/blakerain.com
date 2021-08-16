import React from "react";
import { Location } from "@reach/router";
import { useSiteData } from "react-static";

import { Link } from "components/Router";
import { SearchProvider, SearchContainer } from "components/Search";

const trimTrailingSlash = (str) => {
  return str.length > 0 && str.endsWith("/") ? str.substr(0, str.length - 1) : str;
};

const SiteNavLinks = (props) => {
  const { navigation } = useSiteData();

  return (
    <ul className="navigation">
      {navigation.map((item, index) => {
        var url = item.url;
        if (url.length > 1 && url.endsWith("/")) {
          url = url.substr(0, url.length - 1);
        }

        return (
          <li key={index.toString()}>
            <Link
              to={trimTrailingSlash(item.url)}
              className={props.location.pathname.startsWith(url) ? "active" : ""}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

const SiteNav = (props) => {
  return (
    <React.Fragment>
      <Link to="/" className="logo">
        <img src="/media/logo-text.png" alt="Blake Rain"></img>
      </Link>
      <React.Suspense fallback={<i className="loading">Loading Navigation ...</i>}>
        <SiteNavLinks location={props.location} />
      </React.Suspense>
    </React.Fragment>
  );
};

const SearchLink = (props) => {
  return (
    <a
      href="#"
      title="Search"
      onClick={(event) => {
        event.preventDefault();
        if (props.onSearchClick) {
          props.onSearchClick();
        }
      }}>
      <svg viewBox="0 0 32 32">
        <path d="M 12 0 A 12 12 0 0 0 0 12 A 12 12 0 0 0 12 24 A 12 12 0 0 0 18.753906 21.917969 C 18.887375 22.146246 19.042704 22.366923 19.242188 22.566406 L 27.779297 31.103516 C 28.854914 32.179133 30.462126 32.303499 31.382812 31.382812 C 32.303499 30.462126 32.179133 28.854914 31.103516 27.779297 L 22.566406 19.242188 C 22.364055 19.039836 22.140067 18.882462 21.908203 18.748047 A 12 12 0 0 0 24 12 A 12 12 0 0 0 12 0 z M 12 3.4570312 A 8.5423727 8.5423727 0 0 1 20.542969 12 A 8.5423727 8.5423727 0 0 1 12 20.542969 A 8.5423727 8.5423727 0 0 1 3.4570312 12 A 8.5423727 8.5423727 0 0 1 12 3.4570312 z" />
      </svg>
    </a>
  );
};

const GitHubLink = () => {
  return (
    <a href="https://github.com/BlakeRain" title="GitHub" target="_blank" rel="noopener">
      <svg viewBox="0 0 32 32">
        <path d="M16 .395c-8.836 0-16 7.163-16 16 0 7.069 4.585 13.067 10.942 15.182.8.148 1.094-.347 1.094-.77 0-.381-.015-1.642-.022-2.979-4.452.968-5.391-1.888-5.391-1.888-.728-1.849-1.776-2.341-1.776-2.341-1.452-.993.11-.973.11-.973 1.606.113 2.452 1.649 2.452 1.649 1.427 2.446 3.743 1.739 4.656 1.33.143-1.034.558-1.74 1.016-2.14-3.554-.404-7.29-1.777-7.29-7.907 0-1.747.625-3.174 1.649-4.295-.166-.403-.714-2.03.155-4.234 0 0 1.344-.43 4.401 1.64a15.353 15.353 0 0 1 4.005-.539c1.359.006 2.729.184 4.008.539 3.054-2.07 4.395-1.64 4.395-1.64.871 2.204.323 3.831.157 4.234 1.026 1.12 1.647 2.548 1.647 4.295 0 6.145-3.743 7.498-7.306 7.895.574.497 1.085 1.47 1.085 2.963 0 2.141-.019 3.864-.019 4.391 0 .426.288.925 1.099.768C27.421 29.457 32 23.462 32 16.395c0-8.837-7.164-16-16-16z" />
      </svg>
    </a>
  );
};

const TwitterLink = () => {
  return (
    <a href="https://twitter.com/HalfWayMan" title="Twitter" target="_blank" rel="noopener">
      <svg viewBox="0 0 32 32">
        <path d="M30.063 7.313c-.813 1.125-1.75 2.125-2.875 2.938v.75c0 1.563-.188 3.125-.688 4.625a15.088 15.088 0 0 1-2.063 4.438c-.875 1.438-2 2.688-3.25 3.813a15.015 15.015 0 0 1-4.625 2.563c-1.813.688-3.75 1-5.75 1-3.25 0-6.188-.875-8.875-2.625.438.063.875.125 1.375.125 2.688 0 5.063-.875 7.188-2.5-1.25 0-2.375-.375-3.375-1.125s-1.688-1.688-2.063-2.875c.438.063.813.125 1.125.125.5 0 1-.063 1.5-.25-1.313-.25-2.438-.938-3.313-1.938a5.673 5.673 0 0 1-1.313-3.688v-.063c.813.438 1.688.688 2.625.688a5.228 5.228 0 0 1-1.875-2c-.5-.875-.688-1.813-.688-2.75 0-1.063.25-2.063.75-2.938 1.438 1.75 3.188 3.188 5.25 4.25s4.313 1.688 6.688 1.813a5.579 5.579 0 0 1 1.5-5.438c1.125-1.125 2.5-1.688 4.125-1.688s3.063.625 4.188 1.813a11.48 11.48 0 0 0 3.688-1.375c-.438 1.375-1.313 2.438-2.563 3.188 1.125-.125 2.188-.438 3.313-.875z" />
      </svg>
    </a>
  );
};

const NavigationBar = ({ location, searchVisible, setSearchVisible }) => {
  return (
    <nav className="site-nav">
      <div className="inner">
        <div className="left">
          <SiteNav location={location} />
        </div>
        <div className="right">
          <ul className="buttons">
            <li>
              <SearchLink
                onSearchClick={() => {
                  setSearchVisible(!searchVisible);
                }}
              />
            </li>
            <li>
              <GitHubLink />
            </li>
            <li>
              <TwitterLink />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

const NavigationInner = ({ location, searchData, searchVisible, setSearchVisible }) => {
  return (
    <React.Fragment>
      <NavigationBar
        location={location}
        searchVisible={setSearchVisible}
        setSearchVisible={setSearchVisible}
      />
      <SearchContainer
        visible={searchVisible}
        setSearchVisible={setSearchVisible}
        searchData={searchData}
      />
    </React.Fragment>
  );
};

const Navigation = () => {
  return (
    <Location>
      {({ location }) => (
        <SearchProvider child={NavigationInner} childProps={{ location: location }} />
      )}
    </Location>
  );
};

export default Navigation;
