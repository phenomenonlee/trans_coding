const { Posts } = require("../models");
const { Like } = require("../models");

module.exports = async (req, res, next) => {
  /* 
  여기는 POST 모델에 좋아요 값을 업데이트 하는 미들웨어이다.
  모든 게시글을 찾은 다음에 게시글에 길이 만큼 반복문을 돌린다.
  그 안에다가 Like 모델에서 해당 게시글에 true(좋아요)가 있는지를 찾아낸다.
  만약에 좋아요가 하나라도 없으면 길이가 0이 될 것이고, 아니라면 length를 
  썻을 때 좋아요 한 길이만큼 나올 것이다. 그 값을 가지고 게시글을 하나하나
  업데이트 해준다.
  */
  const posts = await Posts.findAll();

  for (let i = 0; i < posts.length; i++) {
    const like = await Like.findAll({
      where: { postId: posts[i].postId, done: true },
    });
    posts[i].update({ like: like.length });
  }
  next();
};
