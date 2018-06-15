import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyParser from 'koa-bodyparser';
import { environment } from "./json/environment";

import userRouter from './userRouter';
import postRouter from './postRouter';
import commentRouter from './commentRouter';
import adminRouter from './adminRouter';
import uploadFileRouter from './uploadFileRouter';
import oracleDB from './oracleDB';
import * as cors from '@koa/cors';

const app = new Koa();
// app.keys = ['NSNESTOQ123'];  //변조방지 쿠키키
app.context.db = {  //서버쪽 프로퍼티
    "version": "1.0.0"
};

app.use(cors());    //크로스 도메인 허용

app.use(bodyParser({
    onerror: function (err, ctx) {
      ctx.throw('body parse error', 422);
    }
}));

app.use(require('koa-static')('/1TB_Drive/NSNEST_PUBLIC'));   //파일 정적 라우팅

app.use(async (ctx, next) => {
    try {
        ctx.body = ctx.request.body;
        // console.log('[request Url] : ' + ctx.url + " / [request Method] : " + ctx.method);
        
        await next();
    } catch (err) {
        console.error(err.message);
        // ctx.status = err.statusCode || err.status || 500;
        ctx.body = {
            result: false,
            message: err.message
        };
    }
});

//오라클 세션 연결=============================
const db = new oracleDB();
db.createPool();
//=========================================
//Redis 연결 확인============================
var redis = require("redis");
let client = redis.createClient(environment.RedisPort, environment.RedisHost);
client.on("error", function (err) {
    console.error("[redis Error] - " + err);
});
client.quit();
//=========================================

const apiRouter = new Router({ prefix: '/api'});
apiRouter.use('/users', userRouter);
apiRouter.use('/posts', postRouter);
apiRouter.use('/comment', commentRouter);
apiRouter.use('/file', uploadFileRouter);
apiRouter.use('/admin', adminRouter);
app.use(apiRouter.routes());

app.listen(3000);
console.log('===========================');
console.log('OLD NSNEST SERVER Ready!!!!');
console.log('Server running on port 3000');
console.log('===========================');