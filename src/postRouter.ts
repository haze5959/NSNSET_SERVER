/* 게시글정보 형테
{
  postsID: 999999,
  postClassify: 99,
  studentNum: 99,
  publisherId: 9999,
  publisher: '에러',
  publisherIntro: '게시글을 불러오지 못하였습니다.',
  publisherImg: null,
  images: null,
  title: '게시글을 불러오지 못하였습니다.',
  body: '',
  good: 0,
  bad: 0
}
*/

import * as Router from 'koa-router';
import oracleDB from './oracleDB';
import cognitoJWT from './cognitoJWT';
import { Oracledb } from 'oracledb';

const router = new Router();
const pageRowNum = 10;

/**
 * GET
 */
router.get('/', async (ctx) => {  
  const param = ctx.request.query;
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
    ctx.body = "토큰 검증 실패";
    ctx.redirect('/');
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
          con.release();
        }, err => {
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
          con.release();
          ctx.body = {
            result: true,
            message: result
          };
        }, err => {
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
  const param = ctx.request.query;
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
    ctx.body = "토큰 검증 실패";
    return false;
  } 

  const db = new oracleDB();
  console.log("[ctx.params] : " + JSON.stringify(param));
  let postId = param.postId;
  let classify = param.classify;
  let studentNum = param.studentNum;
  let publisherId = param.publisherId;
  let publisherName = param.publisherName;
  let publisherIntro = param.publisherIntro;
  let publisherImg = param.publisherImg;
  let images = param.images;
  let title = param.title;
  let body = param.body;
  let good = param.good;
  let bad = param.bad;
  let MARKER = param.MARKER;
  let TAG = param.TAG;
  await db.getConnection()
      .then(con => {
        return con.execute(`UPDATE POSTS SET 
        POST_DATE = SYSDATE, IMAGES = :images, TITLE = :title, BODY = :body, MARKER = :MARKER, TAG = :TAG
        WHERE POST_ID = :postId`, 
        { images: images, title: title, body: body, MARKER: MARKER, TAG: TAG, postId: postId })
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
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
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