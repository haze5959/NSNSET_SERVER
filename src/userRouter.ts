/* 유저정보 형테
{
    name: '에러',
    intro: '유저정보를 불러오지 못하였습니다.',
    description: '유저정보를 불러오지 못하였습니다.',
    studentNum:99,
    recentDate: new Date('9/9/99'),
    image: null,
    subImage01: null,
    point: 0
  }
*/

import * as Router from 'koa-router';
import oracleDB from './oracleDB';

const router = new Router();

/**
 * GET
 */
router.get('/', async (ctx) => {  
  const param = ctx.request.query;
  const db = new oracleDB();
  console.log("[ctx.params] : " + JSON.stringify(param));
  if(param['userId']){ //해당 유저 아이디에 해당하는 유저 정보 가져오기
    let userId = param['userId'];
    await db.getConnection()
    .then(con => {
      return con.execute('SELECT * FROM USERS WHERE USER_ID = :userId', {userId: userId})
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
  } else {  //모든 유저 정보 가져오기
    var sort = param['sort']?param['sort']:'stNum';
    let count:number = param['count']?param['count']:5;

    if (sort == "update") {  //활동순
      sort = 'RECENT_DATE';
    } else {  //잉여 포인트순 rank
      sort = 'POINT';
    }
    console.log("OQ maxRows - " + count);
    await db.getConnection()
    .then(con => {
      return con.execute('SELECT * FROM USERS ORDER BY :sort desc', { sort: sort }, { maxRows: count })
      .then(result => {
        ctx.body = result.rows;
        console.log("[response] : " + ctx.body);
        con.release();
      }, err => {
        con.release();
        throw err;
      });
    }).catch(err => {
      ctx.body = err.message
      console.error("[error] : " + ctx.body);
    });
  }

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
  // let studentNum = payload.studentNum;
  let userId = payload.userId;
  // let userName = payload.userName;
  // let userImg = payload.userImg;
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
  COMMENT_COUNT = COMMENT_COUNT + 1
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

/**
 * PUT
 */
router.put('/', async (ctx) => {  
  const param = ctx.body;
  // console.log("[ctx.params] : " + JSON.stringify(param));
  
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
    console.error("토큰 검증 실패");
    ctx.body = "토큰 검증 실패";
    return false;
  } 
  const payload = param['payload'];

  if(!payload){
    ctx.body = "페이로드가 없습니다.";
    return false;
  }

  let postId = payload.postId;
  let userId = payload.userId;
  let isGood:boolean = payload.isGood;

  var goodBadQuery = "BAD = BAD + 1";
  if(isGood){
    goodBadQuery = "GOOD = GOOD + 1";
  }

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
  
  //해당 게시글 평가================================================
  await connection.execute(`UPDATE POSTS SET ${goodBadQuery} WHERE POST_ID = :postId`, 
  { postId: postId })
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
    return false;
  });
  //================================================================

  //해당 유저 점수 등록================================================
  await connection.execute(`UPDATE USERS SET POINT = POINT + ${evalPoint} WHERE USER_ID = :userId`, 
  { userId: userId })
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