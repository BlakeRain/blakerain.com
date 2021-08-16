import React from "react";
import { Router } from "@reach/router";
import { Root, Routes, addPrefetchExcludes } from "react-static";

import Navigation from "components/Navigation";
import Footer from "components/Footer";
import { ScrollToTopOnLocation } from "./components/ScrollToTop";

import "normalize.css";
import "./App.less";

// Any routes that start with 'dynamic' will be treated as non-static routes
addPrefetchExcludes(["dynamic"]);

function App() {
  return (
    <Root>
      <Navigation />
      <div className="content">
        <div className="inner">
          <React.Suspense fallback={<h4 className="loading">Loading...</h4>}>
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
