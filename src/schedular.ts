import * as Router from 'koa-router';
import * as koaBody from 'koa-body';
import * as fs from 'fs';
import * as fx from 'mkdir-recursive';
import cognitoJWT from './cognitoJWT';

const router = new Router();

const imagePath = 'NSNEST_PUBLIC/images/elbum';

/**
 * 이미지 등록
 */
router.post('/elbum', async (ctx, next) => { //토큰 검증
  const accessToken:string = ctx.request.header.accesstoken;
  if(!cognitoJWT.check(accessToken?accessToken:'')){  //토큰 검증 실패
    console.error("토큰 검증 실패");
    ctx.body = {
      result: false,
      message: "토큰 검증 실패"
    };
    return false;
  } 

  //폴더 유무 확인
  if (await !fs.existsSync(imagePath)) {
    console.log("createFolder ==> " + imagePath);
    await fx.mkdir(imagePath, 0o777, await function(err) {
      console.log('OQOQOQO000');
      if(err){
        throw err;
      }

      console.log('OQOQOQO111');
      next();
    });
    console.log('OQOQOQO222');
    // await next();
    // await setTimeout(() => next(), 5000); //폴더 만들고 바로 저장시키면 에러가 나와서 딜레이 추가
  } else {
    await next();
  }
}, koaBody({  //이미지 저장
    formidable:{
      uploadDir: imagePath, // directory where files will be uploaded
      keepExtensions: true // keep file extension on upload
    },
    multipart: true,
    urlencoded: true,
    onError: (err, ctx) => {
      console.error(err.message);
      ctx.body = {
        result: false,
        message: err.message
      };
    }
  }), (ctx) => {  //결과값 리턴
    ctx.body = {
      result: true,
      message: ctx.request.body
    };
  }
);

export default router.routes();