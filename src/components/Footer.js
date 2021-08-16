import React from "react";
import { Link } from "@reach/router";

const Footer = () => {
  const date = new Date();

  return (
    <footer className="site-footer">
      <div className="inner">
        <section className="copyright">
          <Link to="/">Blake Rain</Link> &copy; {date.getFullYear().toString()}
        </section>
        <section className="badges">
          <a
            href="https://status.blakerain.com/"
            title="Status page"
            referrerPolicy="origin"
            rel="noopener">
            <img
              src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBlakeRain%2Fupptime.blakerain.com%2Fmaster%2Fapi%2Fblakerain-com%2Fuptime.json"
              alt="Website uptime metric"
            />
          </a>
          <a
            href="https://status.blakerain.com/"
            title="Status page"
            referrerPolicy="origin"
            rel="noopener">
            <img
              src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBlakeRain%2Fupptime.blakerain.com%2Fmaster%2Fapi%2Fblakerain-com%2Fresponse-time-day.json"
              alt="Website response time metric"
            />
          </a>
        </section>
        <section className="navigation">
          <nav>
            <Link to="/blog">Latest Posts</Link>
            <Link to="/tags">Tags</Link>
            <Link to="/disclaimer">Disclaimer</Link>
            <a href="https://twitter.com/HalfWayMan">Twitter</a>
            <a href="https://ghost.org/">Ghost CMS</a>
          </nav>
          <a
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
