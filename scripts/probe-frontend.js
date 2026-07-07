const http = require("http");
http
  .get("http://127.0.0.1:3000/", (r) => {
    let d = "";
    r.on("data", (c) => (d += c));
    r.on("end", () => {
      console.log("status:", r.statusCode);
      console.log("has root:", d.includes('id="root"'));
      console.log("snippet:", d.slice(0, 200));
    });
  })
  .on("error", (e) => console.error("error:", e.message));
