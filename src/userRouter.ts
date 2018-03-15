import * as Router from 'koa-router';

const router = new Router();

router.get('/', async (ctx) => {
    ctx.body = '핼로우 월드라구!';
    // ctx.cookies.set('nsnestCookie', 'testOQ', { signed: true });    //maxAge 도 설정가능
    // ctx.cookies.get('nsnestCookie', { signed: true });
    // ctx.throw(400, 'name required');
    console.log("[response] : " + ctx.body);
});

export default router.routes();