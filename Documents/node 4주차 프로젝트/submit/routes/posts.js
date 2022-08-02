const express = require("express");
const router = express.Router();
const { Posts } = require("../models");
const { User } = require("../models");
const { Comments } = require("../models");
const { Like } = require("../models");

//미들웨어

// 인증 미들웨어
const authMiddleware = require("../middlewares/authMiddleware");
// post 업데이트 미들웨어
const postMiddleware = require("../middlewares/postUpdateMiddleware");

// 전체 게시글 목록 조회 API
router.get("/show", postMiddleware, async (req, res) => {
  const posts = await Posts.findAll();

  const result = posts.map((post) => {
    return {
      postId: post.postId,
      nickname: post.nickname,
      title: post.title,
      text: post.text,
      like: post.like,
      createdAt: post.createdAt,
    };
  });

  res.json({ posts: result.reverse() });
});

// 게시글 작성 API
router.post("/add", authMiddleware, async (req, res) => {
  const { title, text } = req.body;

  // 인증미들웨어에서 보내준 locals 값 가지고 오기
  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });
  await Posts.create({
    title,
    text,
    nickname: userInfo.nickname,
  });
  res.json({
    success: true,
  });
});

// 개별 게시글 조회 API
router.get("/:postId/detail", async (req, res) => {
  const { postId } = req.params;
  const detail = await Posts.findOne({ where: { postId } });

  if (!detail) {
    return res.status(400).json({ errorMessage: "없는 postId입니다." });
  }

  res.json({
    postId,
    nickname: detail.nickname,
    title: detail.title,
    text: detail.text,
    createdAt: detail.createdAt,
  });
});

// 게시글 수정 API
router.patch("/:postId/edit", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });

  await Posts.findOne({ where: { postId } }).then((user) => {
    try {
      if (user.nickname === userInfo.nickname) {
        user.update({ text });
        res.json({
          success: true,
        });
      } else {
        res.status(400).json({ errorMessage: "본인게시물이 아닙니다." });
      }
    } catch (error) {
      res.status(400).json({ errorMessage: "없는 게시물입니다." });
    }
  });
});

// 게시글 삭제 API
router.delete("/:postId/delete", authMiddleware, async (req, res) => {
  const { postId } = req.params;

  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });

  Posts.findOne({ where: { postId } }).then((user) => {
    try {
      if (user.nickname === userInfo.nickname) {
        user.destroy({ where: { postId } });
        Comments.destroy({ where: { postId } });
        res.json({
          success: true,
        });
      } else {
        res.status(400).json({ errorMessage: "본인게시물이 아닙니다." });
      }
    } catch (error) {
      res.status(400).json({ errorMessage: "없는 게시물입니다." });
    }
  });
});

// 게시글 좋아요 및 취소
router.patch("/:postId/like", authMiddleware, async (req, res) => {
  const { postId } = req.params;

  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });

  // 여기서 먼저 postId가 존재하는지 확인한다.
  const existsPost = await Posts.findOne({ where: { postId } });

  if (!existsPost) {
    return res.status(400).json({ errorMessage: "없는 게시물입니다." });
  }

  /* 여기서는 파라미터로 받은 postId와 현재 로그인 된 유저 닉네임을 
  같이 찾아서 내가 해당 게시글에 like api를 실행한 적이 있는지 검사한다.*/
  const like = await Like.findOne({
    where: { postId, nickname: userInfo.nickname },
  });
  // like api를 실행한 적이 없으면 done값을 true로 주고 Like 모델을 생성한다.
  if (!like) {
    Like.create({ nickname: userInfo.nickname, postId, done: true });
    return res.send({ success: "좋아요" });
  }

  /* 여기서는 위에서 이미 파라미터로 받은 postId와 내 닉네임으로 like API를 실행했는지 안 했는지 검사했다.
  그래서 여기까지 온 것은 내가 API를 실행한 적이 있다는 것이다. (postId 와 내가 좋아요 했는지 안 했는지를 
  합치면 고유한 값이 된다.)
  
  그래서 만약에 좋아요를 했으면 다시 취소 시키고 취소되어있으면 다시 좋아요를 시킨다. 전제는 like의 닉네임
  즉 해당 게시글에 좋아료를 누른 닉네임과  현재 내 로그인 정보가 같을 때 이다.*/

  if (like.nickname === userInfo.nickname) {
    if (like.done === false) {
      like.update({ done: true });
      return res.send({ success: "좋아요" });
    }
    if (like.done === true) {
      like.update({ done: false });
      return res.send({ success: "좋아요 취소" });
    }
  }
});

module.exports = router;
