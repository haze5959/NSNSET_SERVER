import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyParser from 'koa-bodyparser';
import userRouter from './userRouter';
import postRouter from './postRouter';
import commentRouter from './commentRouter';
import loginRouter from './loginRouter';
import redis from 'redis';
import oracleDB from './oracleDB';


const app = new Koa();
app.keys = ['NSNESTOQ123'];  //변조방지 쿠키키
app.context.db = {  //서버쪽 프로퍼티
    "version": "1.0.0"
};

app.use(bodyParser({
    onerror: function (err, ctx) {
      ctx.throw('body parse error', 422);
    }
}));

app.use(async (ctx, next) => {
    try {
        ctx.body = ctx.request.body;
        console.log('[request Url] : ' + ctx.url + " / [request Method] : " + ctx.method);
        // console.log(ctx.db.version);
        
        switch (ctx.accepts('json', 'text')) {
            case 'json': 
                console.log('[request json] : ' + ctx.body);
                break;
            case 'text': 
                console.log('[request text] : ' + ctx.body);
                break;
            default: ctx.throw(406, 'json, or text only');
        }
        await next();
    } catch (err) {
        ctx.status = err.statusCode || err.status || 500;
        ctx.body = {
            message: err.message
            //에러 페이지
        };
    }
});

//오라클 세션 연결=============================
const db = new oracleDB();
db.createPool();
//=========================================
//Redis 세션 연결============================
// var client = redis.createClient();
//var client = redis.createClient(port, host);
//=========================================

const apiRouter = new Router({ prefix: '/api'});
apiRouter.use('/users', userRouter);
apiRouter.use('/posts', postRouter);
apiRouter.use('/comment', commentRouter);
apiRouter.use('/login', loginRouter);
app.use(apiRouter.routes());

app.listen(3000);
console.log('===========================');
console.log('OLD NSNEST SERVER Ready!!!!');
console.log('Server running on port 3000');
console.log('===========================');