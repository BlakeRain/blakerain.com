const http = require("https");

exports.handler = async (event) => {
  const req = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "api.github.com",
        method: "POST",
        port: 443,
        path: "/repos/blakerain/blakerain.com/dispatches",
        headers: {
          Authorization: "token " + process.env.GITHUB_TOKEN,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "BlakeRain",
        },
      },
      (res) => {
        let data = "";

        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
        });
      }
    );

    req.on("error", (e) =>
      reject({
        statusCode: 500,
        body: e,
      })
    );

    req.write('{"event_type":"deploy-event"}');
    req.end();
  });

  return req;
};
