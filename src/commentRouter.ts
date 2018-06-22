import * as Router from 'koa-router';
import oracleDB from './oracleDB';
import pushService from "./pushService";

const router = new Router();
const joinUserForm = `SELECT C.COMMENT_ID, C.COMMENT_DATE, U.STUDENT_NUM, C.USER_ID, U.USER_NAME, U.IMAGE, C.EMOTICON, C.GOOD, C.COMMENT_BODY
FROM COMMENTS C JOIN USERS U 
ON (C.USER_ID = U.USER_ID)`;
const registPoint = 2; //댓글 등록 포인트
/**
 * GET
 */
router.get('/', async (ctx) => {  
  const param = ctx.request.query;
  // console.log("[ctx.params] : " + JSON.stringify(param));
  let postId = param['postId'];

  const db = new oracleDB();
  await db.getConnection()
  .then(con => {
    return con.execute(`${joinUserForm} WHERE POST_ID = :postId ORDER BY C.COMMENT_ID`, {postId: postId})
    .then(result => {
      ctx.body = result.rows;
      // console.log("[response] : " + ctx.body);
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
  // console.log("[ctx.params] : " + JSON.stringify(param));
  const payload = param['payload'];

  if(!payload){
    ctx.body = "페이로드가 없습니다.";
    return false;
  }

  let postId = payload.postId;
  let userId = payload.userId;

  let commentEmo = payload.emoticon?payload.emoticon:"";
  let commentBody = payload.comment?payload.comment:"";
  
  const db = new oracleDB();
  let connection = await db.getConnection()
  .then(con => {
    return con;
  }).catch(err => {
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + JSON.stringify(ctx.body));
    return null;
  });

  if(!connection){
    //통신 종료
    return false;
  }
  
  //코맨트 올리기================================================
  await connection.execute(`INSERT INTO COMMENTS 
  (COMMENT_BODY, COMMENT_ID, COMMENT_DATE, USER_ID, EMOTICON, POST_ID, GOOD) 
  VALUES (:commentBody, SEQ_COMMENT_ID.NEXTVAL, SYSDATE, :userId, :commentEmo, :postId, 0)`, 
  { commentBody: commentBody, userId: userId, commentEmo: commentEmo, postId: postId })
  .then(result => {
    // console.log("[response1] : " + JSON.stringify(result));
  }, err => {
    connection.rollback();
    connection.release();
    throw err;
  }).catch(err => {
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + ctx.body);
  });
  //================================================================

  //게시글 댓글 수 올리기================================================
  await connection.execute(`UPDATE POSTS SET 
  COMMENT_COUNT = COMMENT_COUNT + 1, POST_DATE = SYSDATE
  WHERE POST_ID = :postId`, { postId: postId })
  .then(result => {
    // console.log("[response2] : " + JSON.stringify(result));
  }, err => {
    throw err;

  }).catch(err => {
    connection.rollback();
    connection.release();
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + ctx.body);
  });
  //================================================================

  //해당 유저 점수 등록================================================
  await connection.execute(`UPDATE USERS SET POINT = POINT + ${registPoint}, RECENT_DATE = SYSDATE WHERE USER_ID = :userId`, 
  { userId: userId })
  .then(result => {
    // console.log("[response2] : " + JSON.stringify(result));
    connection.release();
    ctx.body = {
      result: true,
      message: result
    };

    //푸시 보내기
    const push = new pushService();
    push.sendWithTopic('comment', payload.userName?payload.userName:'', 20);
  }, err => {
    throw err;
    
  }).catch(err => {
    connection.rollback();
    connection.release();
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + ctx.body);
    return false;
  });
  //================================================================
});

/**
 * DELETE
 */
router.delete('/', async (ctx) => {  

  const param = ctx.request.query;
  // console.log("[ctx.params] : " + JSON.stringify(param));
  let commentId = param.commentId;
  let postId = param.postId;

  const db = new oracleDB();
  let connection = await db.getConnection()
  .then(con => {
    return con;
  }).catch(err => {
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + JSON.stringify(ctx.body));
    return null;
  });

  if(!connection){
    //통신 종료
    return false;
  }

  //댓글 삭제================================================
  await connection.execute(`DELETE FROM COMMENTS WHERE COMMENT_ID = :commentId`, 
  { commentId: commentId })
  .then(result => {
    //성공
  }, err => {
    throw err;

  }).catch(err => {
    connection.rollback();
    connection.release();
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + ctx.body);
  });
  //================================================================

  //게시글 댓글 수 빼기================================================
  await connection.execute(`UPDATE POSTS SET 
  COMMENT_COUNT = COMMENT_COUNT - 1
  WHERE POST_ID = :postId`, { postId: postId })
  .then(result => {
    // console.log("[response2] : " + JSON.stringify(result));
    connection.release();
    ctx.body = {
      result: true,
      message: result
    };
  }, err => {
    throw err;

  }).catch(err => {
    connection.rollback();
    connection.release();
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + ctx.body);
  });
  //================================================================
});

export default router.routes();