import * as Router from 'koa-router';
import oracleDB from './oracleDB';
import cognitoJWT from './cognitoJWT';

const router = new Router();
const joinUserForm = `SELECT P.POST_ID, P.POST_CLASSIFY, U.STUDENT_NUM, P.PUBLISHER_ID, U.USER_NAME, U.USER_INTRO, U.IMAGE, P.TITLE, P.BODY, P.GOOD, P.BAD, P.POST_DATE, P.MARKER, P.TAG, P.COMMENT_COUNT
FROM POSTS P JOIN USERS U 
ON (P.PUBLISHER_ID = U.USER_ID)`;
const pageRowNum = 10;
const registPoint = 5; //글 등록 포인트
const evalPoint = 1; //평가 포인트

/**
 * GET
 */
router.get('/', async (ctx) => {  
  const param = ctx.request.query;
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
    console.error("토큰 검증 실패");
    ctx.body = "토큰 검증 실패";
    return false;
  } 
  
  const db = new oracleDB();
  // console.log("[ctx.params] : " + JSON.stringify(param));
  if(param['postId']){ //해당 게시글 아이디에 해당하는 게시글 정보 가져오기
    let postId = param['postId'];
    await db.getConnection()
    .then(con => {
      return con.execute(`${joinUserForm} WHERE P.POST_ID = :postId`, {postId: postId})
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
  } else {  //모든 게시글 정보 가져오기
    
    let classify:number = param['classify']?param['classify']:0;
    var sortParam = param['sort']?param['sort']:'id';
    let order = param['order']?param['order']:'asc';
    let page = param['page']?param['page']:1;
    let offset:number = (page - 1) * pageRowNum;

    if (sortParam == "id") {  //학번순
      sortParam = 1;
    } else if(sortParam == "good") { //좋아요
      sortParam = 11;
    } else {  //싫어요
      sortParam = 12;
    }

    if (param['contents']) {  //게시글 검색일 시
      let contents = param['contents'];
      await db.getConnection()
      .then(con => {  //TODO:유저 아이디도
        return con.execute(`${joinUserForm} WHERE P.POST_CLASSIFY = :classify AND P.TITLE LIKE '%${contents}%' ORDER BY ${sortParam} ${order} OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY`
        , { classify: classify, offset: offset, maxnumrows: pageRowNum })
        .then(result => {
          ctx.body = result.rows;
          // console.log("[response] : " + ctx.body);
          con.release();
        }, err => {
          con.release();
          throw err;
        }).catch(err => {
          con.release();
          throw err;
        });
      }).catch(err => {
        ctx.body = err.message;
        console.error("[error] : " + ctx.body);
      });
    } else {  //전체 가져오기
      await db.getConnection()
      .then(con => {
        var queryStr = `${joinUserForm} WHERE P.POST_CLASSIFY = :classify ORDER BY ${sortParam} ${order} OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY`;
        var queryJson = { classify: classify, offset: offset, maxnumrows: pageRowNum };
        if (classify == 0) {  //게시글 종류 상관없이 전부
          queryStr = `${joinUserForm} ORDER BY ${sortParam} ${order} OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY`;
          delete queryJson['classify'];
        }
        return con.execute(queryStr, queryJson)
        .then(result => {
          ctx.body = result.rows;
          // console.log("[response] : " + ctx.body);
          con.release();
        }, err => {
          con.release();
          throw err;
        }).catch(err => {
          con.release();
          throw err;
        });
      }).catch(err => {
        ctx.body = err.message;
        console.error("[error] : " + ctx.body);
      });
    }
  }
});

router.get('/pageSize', async (ctx) => {  

  const param = ctx.request.query;
  const db = new oracleDB();
  console.log("[ctx.params] : " + JSON.stringify(param));
  
  await db.getConnection()
  .then(con => {
    let classify = param['classify']?param['classify']:0;

    var queryStr;
    var queryJson = { classify: classify };
    if (param['contents']) {  //게시글 검색일 시
      const contents:string = param['contents'];
      queryStr = `SELECT COUNT(*) FROM POSTS WHERE POST_CLASSIFY = :classify AND TITLE LIKE '%${contents}%'`; //TODO:유저 아이디도
    } else {
      queryStr = 'SELECT COUNT(*) FROM POSTS WHERE POST_CLASSIFY = :classify';
    }
    
    if (classify == 0) {  //게시글 종류 상관없이 전부
      queryStr = 'SELECT COUNT(*) FROM POSTS';
      delete queryJson['classify'];
    }
    return con.execute(queryStr, queryJson)
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
  
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
    console.error("토큰 검증 실패");
    ctx.body = {
      result: false,
      message: "토큰 검증 실패"
    };
    return false;
  } 
  const payload = param['payload'];

  if(!payload){
    ctx.body = {
      result: false,
      message: "페이로드가 없습니다."
    };
    return false;
  }

  let classify = payload.postClassify;
  // let studentNum = payload.studentNum;
  let publisherId = payload.publisherId;
  // let publisherName = payload.publisher;
  // let publisherIntro = payload.publisherIntro?payload.publisherIntro:"";
  // let publisherImg = payload.publisherImg?payload.publisherImg:"";

  let images = "";
  let imageArr:string[] = payload.images;
  if(imageArr && imageArr.length > 0){
    images = imageArr.toString();
  }
  
  let title = payload.title;
  let body = payload.body?payload.body:"";
  let MARKER = payload.MARKER?payload.MARKER:"";

  let TAG = "";
  let tagArr:string[] = payload.TAG;
  if(tagArr && tagArr.length > 0){
    TAG = payload.TAG.toString();
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
  
  //게시글 올리기================================================
  await connection.execute(`INSERT INTO POSTS 
  (POST_ID, POST_DATE, POST_CLASSIFY, PUBLISHER_ID, IMAGES, TITLE, BODY, MARKER, TAG) 
  VALUES (SEQ_ID.NEXTVAL, SYSDATE, :classify, :publisherId, :publisherName, :publisherIntro, :publisherImg, :images, :title, :body, :MARKER, :TAG)`, 
  { classify: classify, publisherId: publisherId, images: images, title: title, body: body, MARKER: MARKER, TAG: TAG })
  .then(result => {
    //성공
    // console.log("[response] : " + JSON.stringify(result));
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
  await connection.execute(`UPDATE USERS SET POINT = POINT + ${registPoint} WHERE USER_ID = :userId`, 
  { userId: publisherId })
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
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
    console.error("토큰 검증 실패");
    ctx.body = "토큰 검증 실패";
    return false;
  } 
  
  // console.log("[ctx.params] : " + JSON.stringify(param));
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

  //게시글 삭제================================================
  await connection.execute(`DELETE FROM POSTS WHERE POST_ID = :postId`, 
  { postId: postId })
  .then(result => {
    // console.log("[response1] : " + JSON.stringify(result));
    return 0;
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

  //해당 게시글 코멘트 삭제================================================
  await connection.execute(`DELETE FROM COMMENTS WHERE POST_ID = :postId`, 
  { postId: postId })
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

export default router.routes();