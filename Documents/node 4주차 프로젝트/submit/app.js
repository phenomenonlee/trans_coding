const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");
app.use(cors());

// body로 받은 json 데이터를 사용하기 위한 코드 , GET 메서드는 이 미들웨어를 거치지 않는다.
app.use(express.json());
// 쿠키 쉽게 가져오기
const cookieParser = require("cookie-parser");
app.use(cookieParser());

//Routers
const postsRouter = require("./routes/posts");
const indexRouter = require("./routes/index");
const commentsRouter = require("./routes/comments");

app.use("/", indexRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);

// Listen
app.listen(port, () => {
  console.log(`listening ${port}`);
});
