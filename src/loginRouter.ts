import * as Router from 'koa-router';
import oracleDB from './oracleDB';

const router = new Router();

/**
 * GET
 */
router.get('/', async (ctx) => {  
  
  const param = ctx.request.query;
  const db = new oracleDB();
  // console.log("[ctx.params] : " + JSON.stringify(param));

  let userId = param['userId'];
  let userPw = param['userPw'];
  //첫 로그인 시 디비에 유저정도 저장
  



  // await db.getConnection()
  // .then(con => {
  //   return con.execute('SELECT * FROM USERS WHERE USER_ID = :userId', {userId: userId})
  //   .then(result => {
  //     ctx.body = result.rows;
  //     console.log("[response] : " + ctx.body);
  //     con.release();
  //   }, err => {
  //     con.release();
  //     throw err;
  //   });
  // }).catch(err => {
  //   ctx.body = err.message;
  //   console.error("[error] : " + ctx.body);
  // });
  
});

export default router.routes();