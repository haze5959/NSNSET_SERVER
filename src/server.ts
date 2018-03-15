import * as Koa from 'koa';
import * as Router from 'koa-router';
import userRouter from './userRouter';


const app = new Koa();
app.keys = ['NSNESTOQ123'];  //변조방지 쿠키키
app.context.db = {  //서버쪽 프로퍼티
    "version": "1.0.0"
};

app.use(async (ctx, next) => {
    try {
        console.log('[request Url] : ' + ctx.url);
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
        //로깅하기
    }
});

const apiRouter = new Router({ prefix: '/api'});
apiRouter.use('/users', userRouter);
app.use(apiRouter.routes());

app.listen(3000);
console.log('===========================');
console.log('OLD NSNEST SERVER Ready!!!!');
console.log('Server running on port 3000');
console.log('===========================');