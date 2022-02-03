import React, { FC, useEffect, useRef, useState } from "react";
import { Decoder } from "../../lib/search/store";
import { PreparedIndex } from "../../lib/search/index";

// The URL from which we load the search data.
const SEARCH_DATA_URL = "/data/search.bin";

/**
 * Properties for a child of SearchProvider
 */
export interface SearchChildProps {
  searchData: PreparedIndex | null;
  searchVisible: boolean;
  setSearchVisible: (visible: boolean) => void;
}

/**
 * Properties for SearchProvider component
 */
export interface SearchProviderProps<CP> {
  child: FC<SearchChildProps & CP>;
  childProps: CP;
}

type SearchProviderType<CP> = FC<SearchProviderProps<CP>>;

/**
 * The search data provider component.
 *
 * This component provides the search data and visibility flag to it's child. This child is
 * then able to use the search data and visibility controls with a `<SearchContainer>`, or
 * other elements that require the search data and controls.
 *
 * Example usage:
 *
 * ```
 * const UsingSearch = (props) => {
 *   return (
 *     <div>
 *       <button type="button" onClick={props.setSearchVisible}>Open Search</button>
 *       <span>Search is {props.searchVisible ? "visible" : "invisible"}</span>
 *       <SearchContainer {... props} />
 *     </div>
 *   );
 * };
 *
 * <SearchProvider child={UsingSearch} />
 * ```
 */
export const SearchProvider: SearchProviderType<any> = (props) => {
  const Child = props.child;
  const searchData = useRef<PreparedIndex | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  // Load the search data from the URL, decode it and store the result in 'searchData'. This
  // function returns a promise that is resolved/rejected depending on whether the load was
  // successful or not.

  const loadSearchData = () => {
    return new Promise<void>((resolve, reject) => {
      // Load the search data from the URL
      console.log("Loading search data from: " + SEARCH_DATA_URL);
      fetch(SEARCH_DATA_URL, { method: "GET", cache: "no-cache" })
        .then((response) => {
          // If we got the data okay, then we want to convert it to an 'ArrayBuffer'
          if (response.ok) {
            response
              .arrayBuffer()
              .then((buffer) => {
                // We have the search data as an 'ArrayBuffer', so we can construct a new
                // 'SearchData' which will parse the data. We assign this as the current value
                // of the 'searchData' reference, which means we won't try and load again.
                searchData.current = new PreparedIndex();
                searchData.current.decode(new Decoder(buffer));

                resolve();
              })
              .catch((err) => {
                // We couldn't convert the data to an 'ArrayBuffer'
                console.error(err);
                reject(err);
              });
          } else {
            // We were unable to load the data
            console.error(
              "Failed to retrieve search data: " + response.statusText
            );
            reject(response.statusText);
          }
        })
        .catch((err) => {
          // We were unable to load the data
          console.error(err);
          reject(err);
        });
    });
  };

  // Convenience wrapper which will first load the search data (using 'loadSearchData') if we
  // do not already have the data loaded. If the data is not loaded, once loading has completed
  // it will set the 'visible' state to true. If the data is already loaded it will immediately
  // set the state to loaded.

  const loadAndSetVisible = () => {
    if (!searchData.current) {
      loadSearchData()
        .then(() => {
          console.log("Search data loaded; setting search box visible");
          setSearchVisible(true);
        })
        .catch(() => {
          console.log(
            "Search data could not be loaded; setting search box visible"
          );
          setSearchVisible(true);
        });
    } else {
      setSearchVisible(true);
    }
  };

  // Handle our search hotkeys: S or Tab to open the search and Escape to close. We check to
  // ensure that the event did not bubble up to the window from an input, select or textarea.

  const onWindowKeyDown = (event: KeyboardEvent) => {
    const tag = (event.target as Element).tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
      if ((event.target as Element).id !== "search-input") {
        return;
      } else if (event.key === "s") {
        return;
      }
    }

    if (!event.repeat) {
      if (event.key === "Tab" || event.key === "s") {
        loadAndSetVisible();
        event.preventDefault();
      } else if (event.key === "Escape") {
        setSearchVisible(false);
        event.preventDefault();
      }
    }
  };

  // When we mount this component we want to add an event listener to the window for our
  // hotkeys; then when we unmount we want to remove the event listener.

  useEffect(() => {
    console.log("Adding window event listener for search hotkeys");
    window.addEventListener("keydown", onWindowKeyDown);

    return () => {
      console.log("Removing window event listener for search hotkeys");
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [false]);

  return (
    <React.Fragment>
      <Child
        {...props.childProps}
        searchVisible={searchVisible}
        searchData={searchData.current}
        setSearchVisible={(visible: boolean) => {
          if (visible) {
            loadAndSetVisible();
          } else {
            setSearchVisible(false);
          }
        }}
      />
    </React.Fragment>
  );
};
