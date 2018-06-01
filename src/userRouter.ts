import * as Router from 'koa-router';
import oracleDB from './oracleDB';
import cognitoJWT from './cognitoJWT';

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

    await db.getConnection()
    .then(con => {
      return con.execute('SELECT * FROM USERS ORDER BY :sort desc OFFSET 0 ROWS FETCH NEXT :maxnumrows ROWS ONLY', { sort: sort, maxnumrows: count})
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

router.get('cognito/', async (ctx) => {  
  const param = ctx.request.query;
  console.log("[ctx.params] : " + JSON.stringify(param));

  let cognitoSub = param['cognitoSub'];
  if(!cognitoSub){ 
    ctx.body = "코그니토 정보가 없습니다.";
    return false;
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

  let isExistUser = true;
  //유저 검색================================================
  await connection.execute('SELECT * FROM USERS WHERE USER_COGNITO_SUB = :cognitoSub', { cognitoSub: cognitoSub })
  .then(result => {
    if(result.rows.length > 0){ //유저가 있다면
      ctx.body = result.rows;
      console.log("[response] : " + ctx.body);
      connection.release();
    } else {  //유저가 없다면 새로 등록한다.
      isExistUser = false;
    }
    
  }, err => {
    throw err;

  }).catch(err => {
    connection.release();
    ctx.body = err.message
    console.error("[error] : " + ctx.body);
  });
  //================================================================

  if(!isExistUser){
    //유저 등록================================================
    let userName = param['name'];
    let userBirthDay = param['birthDay'];
    let userGender = param['gender'];

    await connection.execute(`INSERT INTO USERS 
    (컬럼들......) 
    VALUES (SEQ_ID.NEXTVAL, SYSDATE,)`,   //TODO TODO!!!!!
    { userName: userName, userBirthDay: userBirthDay, userGender: userGender })
    .then(result => {
      console.log("[new user] : " + userName);
      connection.commit();
    }, err => {
      throw err;

    }).catch(err => {
      connection.rollback();
      connection.release();
      ctx.body = err.message
      console.error("[error] : " + ctx.body);
    });
    //================================================================

    //유저 검색================================================
    await connection.execute('SELECT * FROM USERS WHERE USER_COGNITO_SUB = :cognitoSub', { cognitoSub: cognitoSub })
    .then(result => {
      if(result.rows.length > 0){ //유저가 있다면
        ctx.body = result.rows;
        console.log("[response] : " + ctx.body);
        connection.release();
      } else {  //유저가 없음
        throw new Error('유저를 찾지 못하였습니다.');
      }
    }, err => {
      throw err;

    }).catch(err => {
      connection.release();
      ctx.body = err.message
      console.error("[error] : " + ctx.body);
    });
    //================================================================
  }
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
  await connection.execute(`UPDATE POSTS SET OOOOOOOOO WHERE POST_ID = :postId`, 
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