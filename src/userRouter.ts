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
  // ctx.cookies.set('nsnestCookie', 'testOQ', { signed: true });    //maxAge 도 설정가능
  // ctx.cookies.get('nsnestCookie', { signed: true });
  // ctx.throw(400, 'name required');
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
    let count = param['count']?param['count']:5;

    if (sort == "stNum") {  //학번순
      sort = 'STUDENT_NUM';
    } else {  //잉여 포인트순
      sort = 'POINT';
    }

    await db.getConnection()
    .then(con => {
      return con.execute('BEGIN SELECT * FROM USERS ORDER BY :sort desc; END;', {sort: sort}, { maxRows: count })
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

  
});

export default router.routes();