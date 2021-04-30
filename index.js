const express = require("express");
const path = require("path");
const cors = require("cors");

//apply middleware
const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.render("index");
});

/**
 * Bind Views
 */
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.listen("3000", () => {
  console.log("server is connected at localhost:3000");
});
