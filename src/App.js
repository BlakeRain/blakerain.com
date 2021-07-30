import React, { useEffect, useState } from "react";
import { Root, Routes, addPrefetchExcludes } from "react-static";
import { Link, Router } from "components/Router";

import Navigation from "components/Navigation";
import Footer from "components/Footer";
import { SearchData, SearchDialog } from "components/Search";

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
          console.error(response.statusText);
          reject(err);
        }
      });
    });
  }

  function loadAndSetVisible() {
    if (!searchData) {
      loadSearchData().then(() => {
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
  }, [searchData == null]);

  return (
    <Root>
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
      <SearchDialog
        visible={searchVisible}
        setSearchVisible={setSearchVisible}
        searchData={searchData}
      />
      <Footer />
    </Root>
  );
}

export default App;
