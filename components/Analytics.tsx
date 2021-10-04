import React, { useEffect, useState } from "react";

const uuidv4 = (): string => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = parseInt(c, 10);
    return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
  });
};

const ensureStartSlash = (path: string): string => (path.startsWith("/") ? path : "/" + path);

const isIPAddressLike = (host: string): boolean => /[0-9]+$/.test(host.replace(/\./g, ""));

const cleanReferrer = (url: string): string =>
  url
    .replace(/^https?:\/\/((m|l|w{2,3})([0-9]+)?\.)?([^?#]+)(.*)$/, "$4")
    .replace(/^([^/]+)$/, "$1");

interface Dimensions {
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
}

const getDimensions = (): Dimensions => ({
  viewportWidth: window.innerWidth || 0,
  viewportHeight: window.innerHeight || 0,
  screenWidth: (window.screen && window.screen.width) || 0,
  screenHeight: (window.screen && window.screen.height) || 0,
});

const getTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

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

const encodeParamValue = (value: string | number | undefined): string | undefined => {
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
  public referrer: string;
  public dimensions: Dimensions;
  public timezone: string | undefined;
  public duration: number | undefined;
  public scroll: number | undefined;

  constructor() {
    this.uuid = uuidv4();
    this.pathname = ensureStartSlash(window.location.pathname);
    this.referrer = cleanReferrer(document.referrer || "");
    this.dimensions = getDimensions();
    this.timezone = getTimeZone();
    this.duration = undefined;
    this.scroll = undefined;
  }

  toParams(): string {
    var obj: AnalyticsParams = {
      uuid: this.uuid,
      path: this.pathname,
      ua: navigator.userAgent,
      viewport_width: this.dimensions.viewportWidth,
      viewport_height: this.dimensions.viewportHeight,
      screen_width: this.dimensions.screenWidth,
      screen_height: this.dimensions.screenHeight,
      referrer: this.referrer,
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
}

const ANALYTICS_URL = "https://i0wrfe7bpl.execute-api.eu-west-1.amazonaws.com/default/pv.gif";

const AnalyticsImage = ({ data }: { data: AnalyticsData }) => {
  return (
    <img
      style={{ visibility: "hidden", width: 0, height: 0 }}
      src={`${ANALYTICS_URL}?${data.toParams()}`}
    />
  );
};

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      // Do not record analytics for localhost or an IP address
      if (hostname === "localhost" || isIPAddressLike(hostname)) {
        console.warn(`Ignoring analytics for hostname: ${hostname}`);
      } else {
        setAnalyticsData(new AnalyticsData());
      }
    }
  }, []);

  // navigator.sendBeacon

  return analyticsData ? <AnalyticsImage data={analyticsData} /> : null;
};

export default Analytics;
