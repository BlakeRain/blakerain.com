import React, { useEffect, useState } from "react";
import { Root, Routes, addPrefetchExcludes } from "react-static";
import { Router } from "components/Router";

import Navigation from "components/Navigation";
import Footer from "components/Footer";
import { SearchData, SearchContainer } from "components/Search";
import ScrollToTop from "./components/ScrollToTop";

import Dynamic from "containers/Dynamic";

import "normalize.css";
import "./App.less";

// Any routes that start with 'dynamic' will be treated as non-static routes
addPrefetchExcludes(["dynamic"]);

const SEARCH_DATA_URL = process.env.SEARCH_DATA_URL || "https://blakerain.com/data/search.bin";

function App() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchData, setSearchData] = useState(null);

  function loadSearchData() {
    return new Promise((resolve, reject) => {
      fetch(SEARCH_DATA_URL, {
        method: "GET",
        cache: "no-cache",
      }).then((response) => {
        if (response.ok) {
          response
            .arrayBuffer()
            .then((buffer) => {
              setSearchData(new SearchData(buffer));
              resolve();
            })
            .catch((err) => {
              console.error(err);
              reject(err);
            });
        } else {
          console.error("Failed to retrieve search data: " + response.statusText);
          reject(response.statusText);
        }
      });
    });
  }

  function loadAndSetVisible() {
    if (!searchData) {
      loadSearchData()
        .then(() => {
          setSearchVisible(true);
        })
        .catch((err) => {
          setSearchData(null);
          setSearchVisible(true);
        });
    } else {
      setSearchVisible(true);
    }
  }

  function onSearchClick() {
    if (searchVisible) {
      setSearchVisible(false);
    } else {
      loadAndSetVisible();
    }
  }

  function onWindowKeyDown(event) {
    const tag = event.target.tagName;
    if ((tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") && event.key == "s") {
      return;
    }

    if (!event.repeat) {
      if (event.key == "Tab" || event.key == "s") {
        if (!searchVisible) {
          event.stopPropagation();
          event.preventDefault();
          loadAndSetVisible();
        }
      } else if (event.key == "Escape") {
        event.stopPropagation();
        event.preventDefault();
        setSearchVisible(false);
      }
    }
  }

  useEffect(() => {
    console.log("Adding window event listener");
    window.addEventListener("keydown", onWindowKeyDown);

    return () => {
      console.log("Removing window event listener");
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  });

  return (
    <Root>
      <ScrollToTop />
      <Navigation onSearchClick={onSearchClick} />
      <div className="content">
        <div className="inner">
          <React.Suspense fallback={<h4 className="loading">Loading...</h4>}>
            <Router>
              <Dynamic path="dynamic" />
              <Routes path="*" />
            </Router>
          </React.Suspense>
        </div>
      </div>
      <SearchContainer
        visible={searchVisible}
        setSearchVisible={setSearchVisible}
        searchData={searchData}
      />
      <Footer />
    </Root>
  );
}

export default App;
