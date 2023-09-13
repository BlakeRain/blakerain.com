export function getTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function getReferrer() {
  return document.referrer
    .replace(/^https?:\/\/((m|l|w{2,3})([0-9]+)?\.)?([^?#]+)(.*)$/, "$4")
    .replace(/^([^/]+)$/, "$1");
}

export function getPosition() {
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
}

export function sendBeacon(url, body) {
  return fetch(url, {
    keepalive: true,
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
  });
}
