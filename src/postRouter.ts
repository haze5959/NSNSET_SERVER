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
  bad: 0,
  commentId: null
}
*/

import * as Router from 'koa-router';
import oracleDB from './oracleDB';

const router = new Router();
const pageRowNum = 10;

router.get('/', async (ctx) => {  

  const param = ctx.request.query;
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
    
    let classify = param['classify']?param['classify']:0;
    let sort = param['sort']?param['sort']:'id';
    let order = param['order']?param['order']:'asc';
    let page = param['page']?param['page']:1;
    let offset = (page - 1) * pageRowNum;

    if (sort == "id") {  //학번순
      sort = 'STUDENT_NUM';
    } else if(sort == "good") { //좋아요
      sort = 'GOOD';
    } else {  //싫어요
      sort = 'BAD';
    }

    if (param['contents']) {  //게시글 검색일 시
      let contents = param['contents'];
      await db.getConnection()
      .then(con => {
        return con.execute('SELECT * FROM POSTS WHERE POST_CLASSIFY = :classify AND TITLE = :contents ORDER BY :sort :order OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY', { classify: classify, contents: contents, order: order, sort: sort, offset: offset, maxnumrows: pageRowNum })
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
        let queryStr = 'SELECT * FROM POSTS WHERE POST_CLASSIFY = :classify ORDER BY :sort :order OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY';
        if (classify == 0) {  //게시글 종류 상관없이 전부
          queryStr = 'SELECT * FROM POSTS ORDER BY :sort :order OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY';
        }
        return con.execute(queryStr, { classify: classify, order: order, sort: sort, offset: offset, maxnumrows: pageRowNum })
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

export default router.routes();