const express = require("express");
const path = require("path");
const cors = require("cors");

//apply middleware
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
require("dotenv").config();

app.get("/test", (req, res) => {
  res.render("index");
});

/**
 * Bind Views
 */
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.listen(port, () => {
  console.log("server is connected at localhost:3000");
});
