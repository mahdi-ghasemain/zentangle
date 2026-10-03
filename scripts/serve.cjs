// Local-only preview server. Production hosting must serve index.html for application routes.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    const target = path.resolve(
      root,
      "." + decodeURIComponent((req.url || "/").split("?")[0]),
    );
    if (!target.startsWith(root + path.sep) && target !== root) {
      res.writeHead(403).end();
      return;
    }
    const file =
      fs.existsSync(target) && fs.statSync(target).isFile()
        ? target
        : path.join(root, "index.html");
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    fs.createReadStream(file)
      .on("error", () => res.writeHead(500).end())
      .pipe(res);
  })
  .listen(8081, "127.0.0.1", () =>
    console.log("Zentangle preview: http://localhost:8081"),
  );
