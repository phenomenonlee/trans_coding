const express = require("express");
const router = express.Router();
const { User } = require("../models");
const { Posts } = require("../models");
const { Comments } = require("../models");

// 인증 미들웨어 가지고 오기
const authMiddleware = require("../middlewares/authMiddleware");

// 게시물에 관한 모든 댓글 조회 API
router.get("/:postId/show", async (req, res) => {
  const { postId } = req.params;

  const comments = await Comments.findAll({ where: { postId } });
  if (comments.length === 0) {
    return res.status(400).json({ errorMessage: "댓글 내용이 없습니다." });
  }

  const result = comments.map((comment) => {
    return {
      commentId: comment.commentId,
      Writer: comment.nickname,
      text: comment.text,
      createdAt: comment.createdAt,
    };
  });
  res.json({ comments: result.reverse() });
});

// 게시물에 관한 댓글 작성 API
router.post("/:postId/add", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });

  const postInfo = await Posts.findOne({
    where: { postId },
  });
  if (!postInfo) {
    return res.status(400).json({ errorMessage: "없는 게시글입니다." });
  }

  if (!text) {
    return res.status(400).json({ errorMessage: "댓글 내용을 입력해주세요" });
  }

  await Comments.create({
    nickname: userInfo.nickname,
    postId,
    text,
  });
  res.json({ success: true });
});

// 게시물에 관한 댓글 수정
router.patch("/:commentId/edit", authMiddleware, async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;

  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });

  await Comments.findOne({ where: { commentId } }).then((comment) => {
    try {
      if (comment.nickname === userInfo.nickname) {
        comment.update({ text });
        res.json({
          success: true,
        });
      } else {
        res.status(400).json({ errorMessage: "본인 댓글이 아닙니다." });
      }
    } catch (error) {
      res.status(400).json({ errorMessage: "없는 댓글입니다." });
    }
  });
});

// 댓글삭제
router.delete("/:commentId/delete", authMiddleware, async (req, res) => {
  const { commentId } = req.params;

  const user = res.locals.userId;
  const userInfo = await User.findOne({
    where: { userId: user },
  });

  await Comments.findOne({ where: { commentId } }).then((comment) => {
    try {
      if (comment.nickname === userInfo.nickname) {
        comment.destroy({ where: { commentId } });
        res.json({
          success: true,
        });
      } else {
        res.status(400).json({ errorMessage: "본인 댓글이 아닙니다." });
      }
    } catch (error) {
      res.status(400).json({ errorMessage: "없는 댓글입니다." });
    }
  });
});

module.exports = router;
