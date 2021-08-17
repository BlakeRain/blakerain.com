import React from "react";
import { Link } from "@reach/router";
import { createUseStyles } from "react-jss";
import { ContentWidthDefault, PrimaryBackground } from "./Styles";

const useFooterStyles = createUseStyles({
  root: {
    backgroundColor: PrimaryBackground.string(),
    padding: [[20, "5vw"]],
    display: "flex",
    justifyContent: "center",
  },
  inner: {
    maxWidth: ContentWidthDefault,
    width: "100%",
    fontSize: "1.3rem",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",

    "@media (max-width: 650px)": {
      flexDirection: "column",
      alignItems: "center",
    },
  },
  link: {
    color: "rgba(255, 255, 255, 0.7)",

    "&:hover": {
      color: "rgba(255, 255, 255, 1)",
      textDecoration: "none",
    },
  },
  badge: {
    marginLeft: 6,
    "@media (max-width: 650px)": {
      display: "block",
      margin: [[6, "auto"]],
    },
  },
  navigation: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    "@media (max-width: 650px)": {
      alignItems: "center",
    },
  },
  nav: {
    display: "flex",
  },
  navLink: {
    color: "rgba(255, 255, 255, 0.7)",
    position: "relative",
    marginLeft: 20,

    "&:before": {
      content: '""',
      position: "absolute",
      top: 12,
      left: -11,
      display: "block",
      width: 2,
      height: 2,
      background: "rgba(255, 255, 255, 0.5)",
      borderRadius: "100%",
    },

    "&:first-of-type": {
      "&:before": {
        display: "none",
      },
    },

    "@media (max-width: 650px)": {
      "&:first-child": {
        marginLeft: 0,
      },
    },
  },
  saLink: {
    marginTop: "1em",
  },
});

const Footer = () => {
  const classes = useFooterStyles();
  const date = new Date();

  return (
    <footer className={classes.root}>
      <div className={classes.inner}>
        <section>
          <Link to="/" className={classes.link}>
            Blake Rain
          </Link>{" "}
          &copy; {date.getFullYear().toString()}
        </section>
        <section>
          <a
            className={classes.link}
            href="https://status.blakerain.com/"
            title="Status page"
            referrerPolicy="origin"
            rel="noopener">
            <img
              className={classes.badge}
              src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBlakeRain%2Fupptime.blakerain.com%2Fmaster%2Fapi%2Fblakerain-com%2Fuptime.json"
              alt="Website uptime metric"
            />
          </a>
          <a
            className={classes.link}
            href="https://status.blakerain.com/"
            title="Status page"
            referrerPolicy="origin"
            rel="noopener">
            <img
              className={classes.badge}
              src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBlakeRain%2Fupptime.blakerain.com%2Fmaster%2Fapi%2Fblakerain-com%2Fresponse-time-day.json"
              alt="Website response time metric"
            />
          </a>
        </section>
        <section className={classes.navigation}>
          <nav className={classes.nav}>
            <Link className={classes.navLink} to="/blog">
              Latest Posts
            </Link>
            <Link className={classes.navLink} to="/tags">
              Tags
            </Link>
            <Link className={classes.navLink} to="/disclaimer">
              Disclaimer
            </Link>
            <a className={classes.navLink} href="https://twitter.com/HalfWayMan">
              Twitter
            </a>
            <a className={classes.navLink} href="https://ghost.org/">
              Ghost CMS
            </a>
          </nav>
          <a
            className={classes.saLink}
            href="https://simpleanalytics.com/?utm_source=blakerain.com&utm_content=badge"
            referrerPolicy="origin"
            rel="noopener"
            target="_blank">
            <img
              src="https://simpleanalyticsbadge.com/blakerain.com?mode=dark&background=1a1c20&logo=13304e"
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              alt="Simple Analytics"
            />
          </a>
        </section>
      </div>
    </footer>
  );
};

export default Footer;
