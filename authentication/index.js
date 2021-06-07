const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.set("view engine", "pug");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const SECRET = "TOKEN_SECRET";
let users = [];

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (token)
    jwt.verify(token, SECRET, (err, decoded) => {
      req.user = err || decoded.data;
    });

  next();
}

app.use(authMiddleware);

app.get("/", (req, res) => {
  res.render("index", { name: req.user?.name, error: req.query?.error });
});

const apiRoute = express.Router();

apiRoute.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.redirect("/?error=missing credentials");

  const user = users.find(
    (user) => username === user.username && password === user.password
  );

  if (!user) return res.redirect("/?error=invalid credentials");

  const token = jwt.sign({ data: { name: user.name } }, SECRET);
  res.cookie("token", token, { httpOnly: true });
  res.redirect("/");
});

apiRoute.post("/register", (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password)
    return res.redirect("/?error=missing credentials");

  if (users.some((user) => username === user.username))
    return res.redirect("/?error=username already exists");

  let user = {
    name,
    username,
    password,
  };

  users = [user, ...users];

  const token = jwt.sign({ data: { name } }, SECRET);
  res.cookie("token", token, { httpOnly: true });
  res.redirect("/");
});

apiRoute.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.use("/api", apiRoute);

app.listen(8080, () => {
  console.log("Listening on :8080");
});
