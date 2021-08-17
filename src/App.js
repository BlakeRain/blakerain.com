import React from "react";
import { Router } from "@reach/router";
import { Root, Routes, addPrefetchExcludes } from "react-static";
import { createUseStyles } from "react-jss";

import Navigation from "components/Navigation";
import Footer from "components/Footer";
import { ScrollToTopOnLocation } from "./components/ScrollToTop";

import "normalize.css";
import "./App.less";
import { ContentWidthDefault } from "./components/Styles";

// Any routes that start with 'dynamic' will be treated as non-static routes
addPrefetchExcludes(["dynamic"]);

const useAppStyles = createUseStyles({
  content: {
    display: "flex",
    justifyContent: "center",
    padding: [[0, "5vw"]],
  },
  inner: {
    width: "100%",
    maxWidth: ContentWidthDefault,
  },
  loading: {
    textAlign: "center",
  },
});

function App() {
  const classes = useAppStyles();

  return (
    <Root>
      <Navigation />
      <div className={classes.content}>
        <div className={classes.inner}>
          <React.Suspense fallback={<h4 className={classes.loading}>Loading...</h4>}>
            <Router>
              <Routes path="*" />
            </Router>
          </React.Suspense>
          <ScrollToTopOnLocation />
        </div>
      </div>
      <Footer />
    </Root>
  );
}

export default App;
