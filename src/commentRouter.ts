/* 코맨트 형테
{
  commentId: 999999,
  postId:9999,
  commentDate: new Date('9/99/99'),
  studentNum: 99,
  userId: 9999,
  userName: "에러",
  userImg: null,
  emoticon: null,
  comment: "코멘트를 불러오지 못하였습니다.",
  good: 0
}
*/

import * as Router from 'koa-router';
import oracleDB from './oracleDB';

const router = new Router();

/**
 * GET
 */
router.get('/', async (ctx) => {  
  // ctx.cookies.set('nsnestCookie', 'testOQ', { signed: true });    //maxAge 도 설정가능
  // ctx.cookies.get('nsnestCookie', { signed: true });
  // ctx.throw(400, 'name required');
  const param = ctx.request.query;
  console.log("[ctx.params] : " + JSON.stringify(param));
  let postId = param['postId'];

  const db = new oracleDB();
  await db.getConnection()
  .then(con => {
    return con.execute('SELECT * FROM COMMENTS WHERE POST_ID = :postId', {postId: postId})
    .then(result => {
      ctx.body = result.rows;
      console.log("[response] : " + ctx.body);
      con.release();
    }, err => {
      con.release();
      throw err;
    });
  }).catch(err => {
    ctx.body = err.message;
    console.error("[error] : " + ctx.body);
  });

  
});

/**
 * POST
 */
router.post('/', async (ctx) => {  

  const param = ctx.body;
  console.log("[ctx.params] : " + JSON.stringify(param));
  const payload = param['payload'];

  if(!payload){
    ctx.body = "페이로드가 없습니다.";
    return false;
  }

  let postId = payload.postId;
  // let studentNum = payload.studentNum;
  let userId = payload.userId;
  // let userName = payload.userName;
  // let userImg = payload.userImg;
  let emoticon = payload.emoticon?payload.emoticon:"";

  let comment = payload.comment?payload.comment:"";
  // values (SEQ_ID.NEXTVAL, SYSDATE, 111, 111, "TESTER", "", "", 0, "TEST TEST", 111)
  const db = new oracleDB();
  await db.getConnection()
      .then(con => {
        return con.execute(`INSERT INTO COMMENTS 
        (COMMENT_BODY, COMMENT_ID, COMMENT_DATE, STUDENT_ID, USER_ID, USER_NAME, USER_IMG, EMOTICON, POST_ID, GOOD) 
        VALUES (:comment, 222, '', 0, :userId, 'testser', '', :emoticon, :postId, 0)`, 
        // (COMMENT_ID, COMMENT_DATE, USER_ID, EMOTICON, COMMENT_BODY, POST_ID) 
        // { userId: userId, emoticon: emoticon, comment: comment, postId: postId })
        { comment: comment, userId: userId, emoticon: emoticon, postId: postId })
        .then(result => {
          console.log("[response1] : " + JSON.stringify(result));
          // ctx.body = {
          //   result: true,
          //   message: result
          // };
        }, err => {
          con.rollback();
          con.release();
          throw err;

        }).then(() => { //게시글 댓글 수 올리기
          con.execute(`UPDATE POSTS SET 
          COMMENT_COUNT = SEQ_ID.NEXTVAL
          WHERE POST_ID = :postId`, { postId: postId })
          .then(result => {
            console.log("[response2] : " + JSON.stringify(result));
            con.release();
            ctx.body = {
              result: true,
              message: result
            };
          }, err => {
            con.rollback();
            con.release();
            throw err;
          })
        });
      }).catch(err => {
        ctx.body = {
          result: false,
          message: err.message
        };
        console.error("[error] : " + JSON.stringify(ctx.body));
      });
});

/**
 * DELETE
 */
router.delete('/', async (ctx) => {  

  const param = ctx.request.query;
  const db = new oracleDB();
  console.log("[ctx.params] : " + JSON.stringify(param));
  let commentId = param.commentId;

  await db.getConnection()
      .then(con => {
        return con.execute(`DELETE FROM COMMENTS WHERE POST_ID = :commentId`, 
        { commentId: commentId })
        .then(result => {
          con.release();
          ctx.body = true;
        }, err => {
          con.release();
          throw err;
        });
      }).catch(err => {
        ctx.body = err.message;
        console.error("[error] : " + ctx.body);
      });
});

export default router.routes();