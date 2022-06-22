//
// Site Analytics
//
// This module provides an `Analytics` component that embeds an image into the page which records analytics data.
//
// More information about this can be found here: https://blakerain.com/disclaimer#analytics
//

import React, { useEffect, useState } from "react";

// Generate a UUID for a page request
//
// I think I got this from: https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
const uuidv4 = (): string => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = parseInt(c, 10);
    return (
      n ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))
    ).toString(16);
  });
};

// We prefer all paths to start with a forward slash
const ensureStartSlash = (path: string): string =>
  path.startsWith("/") ? path : "/" + path;

// Check if the hostname looks a bit like an IP address
const isIPAddressLike = (host: string): boolean =>
  /[0-9]+$/.test(host.replace(/\./g, ""));

// Clear up the referrer, removing any excessive components
const cleanReferrer = (url: string): string =>
  url
    .replace(/^https?:\/\/((m|l|w{2,3})([0-9]+)?\.)?([^?#]+)(.*)$/, "$4")
    .replace(/^([^/]+)$/, "$1");

// Get the distance scrolled through the document
const getPosition = (): number => {
  try {
    const doc = window.document.documentElement;
    const body = window.document.body;

    return Math.min(
      100,
      5 *
        Math.round(
          (100 * (doc.scrollTop + doc.clientHeight)) / body.scrollHeight / 5
        )
    );
  } catch {
    return 0;
  }
};

// The dimensions of the viewport and screen
interface Dimensions {
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
}

// Get the dimensions of the viewport and screen
const getDimensions = (): Dimensions => ({
  viewportWidth: window.innerWidth || 0,
  viewportHeight: window.innerHeight || 0,
  screenWidth: (window.screen && window.screen.width) || 0,
  screenHeight: (window.screen && window.screen.height) || 0,
});

// Get the TZ
const getTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

// The parameters that we pass to our analytics API
interface AnalyticsParams {
  uuid: string;
  path: string;
  ua: string;
  viewport_width: number;
  viewport_height: number;
  screen_width: number;
  screen_height: number;
  referrer: string;

  timezone?: string;
  duration?: number;
  scroll?: number;
}

// Encode a value as a parameter for the API call query-string. This handles the encoding of numbers, strings,
// or missing fields that are 'undefined'.
const encodeParamValue = (
  value: string | number | undefined
): string | undefined => {
  if (typeof value === "string") {
    return encodeURIComponent(value);
  } else if (typeof value === "number") {
    return value.toString(10);
  } else {
    return undefined;
  }
};

class AnalyticsData {
  public uuid: string;
  public pathname: string;
  public ua: string;
  public referrer: string;
  public dimensions: Dimensions;
  public timezone: string | undefined;
  public duration: number = 0;
  public scroll: number = 0;
  private start: number;
  private hideStart: number = 0;
  private totalHidden: number = 0;

  constructor() {
    this.uuid = uuidv4();
    this.pathname = ensureStartSlash(window.location.pathname);
    this.ua = navigator.userAgent;
    this.referrer = cleanReferrer(document.referrer || "");
    this.dimensions = getDimensions();
    this.timezone = getTimeZone();
    this.start = Date.now();
  }

  // Collect up the `AnalyticsParams` and render them into a querystring
  toParams(): string {
    var obj: AnalyticsParams = {
      uuid: this.uuid,
      path: this.pathname,
      ua: this.ua,
      viewport_width: this.dimensions.viewportWidth,
      viewport_height: this.dimensions.viewportHeight,
      screen_width: this.dimensions.screenWidth,
      screen_height: this.dimensions.screenHeight,
      referrer: this.referrer,
      duration: this.duration,
      scroll: this.scroll,
    };

    if (this.timezone) {
      obj.timezone = this.timezone;
    }

    return (Object.keys(obj) as Array<keyof AnalyticsParams>)
      .map((key) => {
        const encoded = encodeParamValue(obj[key]);
        return encoded ? `${key}=${encoded}` : undefined;
      })
      .filter((param) => typeof param === "string")
      .join("&");
  }

  toBeaconJson(): string {
    return JSON.stringify({
      uuid: this.uuid,
      path: this.pathname,
      duration: this.duration,
      scroll: this.scroll,
    });
  }

  onScroll() {
    const position = getPosition();
    if (this.scroll < position) {
      this.scroll = position;
    }
  }

  onVisibilityChange() {
    if (window.document.hidden) {
      if (!("onpagehide" in window)) {
        this.sendBeacon();
      }

      this.hideStart = Date.now();
    } else {
      this.totalHidden += Date.now() - this.hideStart;
    }
  }

  sendBeacon() {
    this.duration = Math.round(
      (Date.now() - this.start - this.totalHidden) / 1000.0
    );
    this.scroll = Math.max(0, this.scroll, getPosition());
    navigator.sendBeacon(ANALYTICS_APPEND_URL, this.toBeaconJson());
  }
}

// This is the path to our analytics image. We append the query string from the `AnalyticsData` to this URL.
const ANALYTICS_URL = "https://pv.blakerain.com/pv.gif";

// This is the path to our analytics append function.
const ANALYTICS_APPEND_URL = "https://pv.blakerain.com/append";

// Renders an image using our analytics image.
//
// This effectively calls our analytics API and passes the data we collect in the `AnalyticsData` class.
const AnalyticsImage = ({ data }: { data: AnalyticsData }) => {
  return (
    <img
      style={{
        visibility: "hidden",
        width: 0,
        height: 0,
        position: "absolute",
        bottom: 0,
        right: 0,
      }}
      src={`${ANALYTICS_URL}?${data.toParams()}`}
    />
  );
};

/**
 * Analytics embed
 *
 * This component will add an invisible image element into the document. The URL of the image includes analytics
 * information gathered in the `AnalyticsData` class. The loading of this image causes the analytics information to be
 * stored in our database.
 */
const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      // Do not record analytics for localhost or an IP address
      if (hostname === "localhost" || isIPAddressLike(hostname)) {
        console.warn(`Ignoring analytics for hostname: ${hostname}`);
        return;
      }

      const analytics = new AnalyticsData();
      setAnalyticsData(analytics);

      const onScrollEvent = () => {
        analytics.onScroll();
      };

      const onVisibilityChange = () => {
        analytics.onVisibilityChange();
      };

      const onPageHide = () => {
        analytics.sendBeacon();
      };

      window.addEventListener("scroll", onScrollEvent);
      window.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("pagehide", onPageHide);
      return () => {
        window.removeEventListener("scroll", onScrollEvent);
        window.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("pagehide", onPageHide);
        analytics.sendBeacon();
      };
    }
  }, []);

  // navigator.sendBeacon

  return analyticsData ? <AnalyticsImage data={analyticsData} /> : null;
};

export const AnalyticsInformation = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAnalyticsData(new AnalyticsData());
    }
  }, []);

  if (analyticsData) {
    return (
      <table className="columnOriented">
        <tbody>
          <tr>
            <th style={{ width: "20rem" }}>Pathname of page</th>
            <td>{analyticsData.pathname}</td>
          </tr>
          <tr>
            <th>User Agent</th>
            <td>{analyticsData.ua}</td>
          </tr>
          <tr>
            <th>Referrer</th>
            <td>{analyticsData.referrer}</td>
          </tr>
          <tr>
            <th>Screen Dimensions</th>
            <td>
              {analyticsData.dimensions.screenWidth} x{" "}
              {analyticsData.dimensions.screenHeight}
            </td>
          </tr>
          <tr>
            <th>Viewport Dimensions</th>
            <td>
              {analyticsData.dimensions.viewportWidth} x{" "}
              {analyticsData.dimensions.viewportHeight}
            </td>
          </tr>
          <tr>
            <th>Time zone</th>
            <td>{analyticsData.timezone}</td>
          </tr>
        </tbody>
      </table>
    );
  } else {
    return null;
  }
};

export default Analytics;
