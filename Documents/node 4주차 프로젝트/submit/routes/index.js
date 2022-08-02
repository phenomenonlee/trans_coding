const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");

//미들웨어

// 인증 미들웨어
const authMiddleware = require("../middlewares/authMiddleware");
// post 업데이트 미들웨어
const postMiddleware = require("../middlewares/postUpdateMiddleware");

// 모델 가져오기
const { User } = require("../models");
const { Like } = require("../models");
const { Posts } = require("../models");

// root 페이지
router.get("/", (req, res) => {
  res.send("Hello Node.Js world");
});

// 회원가입 API
router.post("/join", async (req, res) => {
  const { nickname, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).send({ errorMessage: "패스워드가 일치하지 않습니다." });
    return;
  }
  const regexNickname = new RegExp("(^[A-Za-z0-9]{3,15}$)");
  if (!regexNickname.test(nickname)) {
    return res
      .status(400)
      .json({ errorMessage: "nickname을 다시 확인해 주세요" });
  }

  const includePassword = password.includes(`${nickname}`);
  const regexPassword = new RegExp("(^[A-Za-z0-9]{4,20}$)");

  if (includePassword || !regexPassword.test(password)) {
    return res
      .status(400)
      .json({ errorMessage: "패스워드를 다시 확인해주세요" });
  }

  // nicname이 동일한게 이미 있는지 확인하기 위해 가져옴
  const existsUsers = await User.findOne({
    where: { nickname },
  });

  if (existsUsers) {
    res.status(400).send({ errorMessage: "닉네임이 사용중입니다." });
    return;
  }

  await User.create({ nickname, password });
  res.status(201).send({ success: true });
});

// 로그인 API
router.post("/login", async (req, res) => {
  const { cookie } = req.cookies;
  if (cookie) {
    return res.status(400).send({ errorMessage: "이미 로그인 하셨습니다." });
  }
  const { nickname, password } = req.body;

  const user = await User.findOne({ where: { nickname, password } });

  if (!user || password !== user.password) {
    res
      .status(400)
      .send({ errorMessage: "닉네임 또는 패스워드가 틀렸습니다." });
    return;
  }

  const token = jwt.sign({ userId: user.userId }, "key");
  res.cookie("cookie", token);
  return res.status(200).send({ success: true });
});

// 로그아웃 API
router.get("/logout", async (req, res) => {
  const { cookie } = req.cookies;
  if (!cookie) {
    return res.send({ errorMessage: "이미 로그아웃 하셨습니다." });
  }
  res.clearCookie("cookie").send("로그아웃 되셨습니다.");
});

// 내가 좋아요 한 게시글 조회
router.get("/mylike", authMiddleware, postMiddleware, async (req, res) => {
  let array = [];
  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });

  //내가 좋아요 한 게시물 찾기
  const myLike = await Like.findAll({
    where: { nickname: userInfo.nickname, done: true },
  });

  // 내가 좋아요 한 게시물 좋아요 횟수 찾기
  for (let i = 0; i < myLike.length; i++) {
    const result = await Posts.findAll({ where: { postId: myLike[i].postId } });
    array.push(result);
  }

  const answer = array
    .sort((a, b) => {
      return b[0].like - a[0].like;
    })
    .map((curV) => {
      return {
        postId: curV[0].postId,
        nickname: curV[0].nickname,
        title: curV[0].title,
        text: curV[0].text,
        like: curV[0].like,
        createdAt: curV[0].createdAt,
      };
    });
  res.json({ myLike: answer });
});

module.exports = router;
