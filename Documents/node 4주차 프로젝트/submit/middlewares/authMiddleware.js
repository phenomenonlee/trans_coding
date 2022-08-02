const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = (req, res, next) => {
  try {
    const { cookie } = req.cookies;
    const decodeCookie = jwt.verify(cookie, "key");
    res.locals.userId = decodeCookie.userId;
    next();
  } catch (error) {
    return res.status(400).send({ errorMessage: "로그인 후 이용 가능합니다." });
  }
};
