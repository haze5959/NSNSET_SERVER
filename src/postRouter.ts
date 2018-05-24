import * as Router from 'koa-router';
import oracleDB from './oracleDB';
import cognitoJWT from './cognitoJWT';

const router = new Router();
const pageRowNum = 10;

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
  console.log("[ctx.params] : " + JSON.stringify(param));
  if(param['postId']){ //해당 게시글 아이디에 해당하는 게시글 정보 가져오기
    let postId = param['postId'];
    await db.getConnection()
    .then(con => {
      return con.execute('SELECT * FROM POSTS WHERE POST_ID = :postId', {postId: postId})
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
  } else {  //모든 게시글 정보 가져오기
    
    let classify:number = param['classify']?param['classify']:0;
    var sort = param['sort']?param['sort']:'id';
    let order = param['order']?param['order']:'asc';
    let page = param['page']?param['page']:1;
    let offset:number = (page - 1) * pageRowNum;

    if (sort == "id") {  //학번순
      sort = 'POST_ID';
    } else if(sort == "good") { //좋아요
      sort = 'GOOD';
    } else {  //싫어요
      sort = 'BAD';
    }

    if (param['contents']) {  //게시글 검색일 시
      let contents = param['contents'];
      await db.getConnection()
      .then(con => {
        return con.execute('SELECT * FROM POSTS WHERE POST_CLASSIFY = :classify AND TITLE = :contents ORDER BY :sort ' + order + ' OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY', { classify: classify, contents: contents, sort: sort, offset: offset, maxnumrows: pageRowNum })
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
    } else {  //전체 가져오기
      await db.getConnection()
      .then(con => {
        var queryStr = 'SELECT * FROM POSTS WHERE POST_CLASSIFY = :classify ORDER BY 1 ' + order + ' OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY';
        var queryJson = { classify: classify, offset: offset, maxnumrows: pageRowNum };
        if (classify == 0) {  //게시글 종류 상관없이 전부
          queryStr = 'SELECT * FROM POSTS ORDER BY 1 ' + order + ' OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY';
          delete queryJson['classify'];
        }
        return con.execute(queryStr, queryJson)
        .then(result => {
          ctx.body = result.rows;
          console.log("[response] : " + ctx.body);
          con.commit();
          con.release();
        }, err => {
          con.rollback();
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
    var queryStr = 'SELECT COUNT(*) FROM POSTS WHERE POST_CLASSIFY = :classify';
    var queryJson = { classify: classify };
    if (classify == 0) {  //게시글 종류 상관없이 전부
      queryStr = 'SELECT COUNT(*) FROM POSTS';
      delete queryJson['classify'];
    }
    return con.execute(queryStr, queryJson)
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

  let classify = payload.postClassify;
  let studentNum = payload.studentNum;
  let publisherId = payload.publisherId;
  let publisherName = payload.publisher;
  let publisherIntro = payload.publisherIntro?payload.publisherIntro:"";
  let publisherImg = payload.publisherImg?payload.publisherImg:"";
  let images = payload.images?payload.images:"";
  let title = payload.title;
  let body = payload.body?payload.body:"";
  let MARKER = payload.MARKER?payload.MARKER:"";
  let TAG = payload.TAG?payload.TAG:"";
  const db = new oracleDB();
  await db.getConnection()
      .then(con => {
        return con.execute(`INSERT INTO POSTS 
        (POST_ID, POST_DATE, POST_CLASSIFY, STUDENT_NUM, PUBLISHER_ID, PUBLISHER_NAME, PUBLISHER_INTRO, PUBLISHER_IMG, IMAGES, TITLE, BODY, MARKER, TAG) 
        VALUES (SEQ_ID.NEXTVAL, SYSDATE, :classify, :studentNum, :publisherId, :publisherName, :publisherIntro, :publisherImg, :images, :title, :body, :MARKER, :TAG)`, 
        { classify: classify, studentNum: studentNum, publisherId: publisherId, publisherName: publisherName, publisherIntro: publisherIntro, publisherImg: publisherImg, images: images, title: title, body: body, MARKER: MARKER, TAG: TAG })
        .then(result => {
          console.log("[response] : " + JSON.stringify(result));
          con.release();
          ctx.body = {
            result: true,
            message: result
          };
        }, err => {
          console.log("[error] : " + err.message);
          con.release();
          ctx.body = {
            result: false,
            message: err.message
          };
        });
      }).catch(err => {
        ctx.body = {
          result: false,
          message: err.message
        };
        console.error("[error] : " + ctx.body);
      });
});

/**
 * PUT
 */
router.put('/', async (ctx) => {  
  const param = ctx.body;
  console.log("[ctx.params] : " + JSON.stringify(param));
  
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
  let isGood:boolean = payload.isGood;

  var goodBadQuery = "BAD = BAD + 1";
  if(isGood){
    goodBadQuery = "GOOD = GOOD + 1";
  }

  const db = new oracleDB();
  await db.getConnection()
      .then(con => {
        return con.execute('UPDATE POSTS SET '
        + goodBadQuery + 
        ' WHERE POST_ID = :postId', 
        { postId: postId })
        .then(result => {
          con.release();
          ctx.body = {
            result: true,
            message: result
          };
        }, err => {
          con.release();
          throw err;
        });
      }).catch(err => {
        ctx.body = {
          result: false,
          message: err.message
        };
        console.error("[error] : " + ctx.body);
      });
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
  
  const db = new oracleDB();
  console.log("[ctx.params] : " + JSON.stringify(param));
  let postId = param.postId;

  await db.getConnection()
      .then(con => {
        return con.execute(`DELETE FROM POSTS WHERE POST_ID = :postId`, 
        { postId: postId })
        .then(result => {
          console.log("[response1] : " + JSON.stringify(result));
          return 0;
        }, err => {
          con.release();
          throw err;
        }).then(con => {  //해당 게시글
          con.execute(`DELETE FROM COMMENTS WHERE POST_ID = :postId`, 
          { postId: postId })
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
          });

        }, err => {
          con.rollback();
          con.release();
          throw err;
        });
      }).catch(err => {
        ctx.body = {
          result: false,
          message: err.message
        };
        console.error("[error] : " + ctx.body);
      });
});

export default router.routes();