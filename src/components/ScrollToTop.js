import React, { useEffect, useRef, useState } from "react";
import { Location } from "@reach/router";

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

export const ScrollToTop = () => {
  return <Location>{({ location }) => <LocationChangeWorker location={location} />}</Location>;
};

export const ScrollToTopButton = (props) => {
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
      className={"scroll-to-top " + (props.className || "")}
      tabIndex={-1}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}>
      &uarr; Goto Top
    </button>
  ) : null;
};
