import { useEffect } from "react";
import { useLocation } from "@reach/router";

const ScrollToTop = (props) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
