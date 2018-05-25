import * as Router from 'koa-router';

const router = new Router();

/**
 * 이미지 등록
 */
/**
 * POST
 */
router.post('/', async (ctx) => {  
    const param = ctx.body;
    console.log("[ctx.params] : " + JSON.stringify(param));
    
    const type = param['type'];
    const image = param['image'];
  
    if(!type || !image){
      ctx.body = "잘 못 된 파라미터입니다.";
      return false;
    }

    //이미지 저장
    
  });


export default router.routes();