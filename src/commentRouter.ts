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
  const db = new oracleDB();
  console.log("[ctx.params] : " + JSON.stringify(param));

  let postId = param['postId'];
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

  const param = ctx.request.query;
  const db = new oracleDB();
  console.log("[ctx.params] : " + JSON.stringify(param));
  let postId = param.postId;
  let studentNum = param.studentNum;
  let userId = param.userId;
  let userName = param.userName;
  let userImg = param.userImg;
  let emoticon = param.emoticon;
  let comment = param.comment;
  let good = param.good;

  await db.getConnection()
      .then(con => {
        return con.execute(`INSERT INTO COMMENTS 
        (COMMENT_ID, COMMENT_DATE, STUDENT_ID, USER_ID, USER_NAME, USER_IMG, EMOTICON, GOOD, COMMENT_BODY, POST_ID) 
        VALUES (SEQ_ID.NEXTVAL, SYSDATE, :studentNum, :userId, :userName, :userImg, :emoticon, :good, :comment, :postId)`, 
        { studentNum: studentNum, userName: userName, userImg: userImg, emoticon: emoticon, good: good, comment: comment, postId: postId })
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