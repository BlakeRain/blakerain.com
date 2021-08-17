import React, { useEffect, useRef, useState } from "react";
import { Location } from "@reach/router";
import { createUseStyles } from "react-jss";
import { PrimaryBackground } from "./Styles";

const LocationChangeWorker = ({ location }) => {
  const locationRef = useRef("");

  useEffect(() => {
    if (location.pathname !== locationRef.current) {
      console.log(
        `Location changed from '${locationRef.current}' to '${location.pathname}'; scrolling to top of window`
      );
      locationRef.current = location.pathname;
      window.scrollTo(0, 0);
    }
  });

  return null;
};

export const ScrollToTopOnLocation = () => {
  return <Location>{({ location }) => <LocationChangeWorker location={location} />}</Location>;
};

const useStyles = createUseStyles({
  scrollToTop: {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    border: "none",
    borderRadius: 5,
    color: "white",
    backgroundColor: PrimaryBackground.lighten(1.25).string(),
    cursor: "pointer",
    fontSize: "80%",
    zIndex: 50,
  },
});

export const ScrollToTopButton = (props) => {
  const classes = useStyles();
  const [visible, setVisible] = useState(false);

  const onDocumentScroll = () => {
    if (window.pageYOffset > 300) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("scroll", onDocumentScroll);

    return () => {
      document.removeEventListener("scroll", onDocumentScroll);
    };
  }, []);

  return visible ? (
    <button
      className={classes.scrollToTop + " scroll-button"}
      tabIndex={-1}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}>
      &uarr; Goto Top
    </button>
  ) : null;
};
