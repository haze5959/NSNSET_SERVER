import * as Router from 'koa-router';
import * as koaBody from 'koa-body';
import * as fs from 'fs';
import * as fx from 'mkdir-recursive';
import cognitoJWT from './cognitoJWT';
import redisDB from './redisDB';

const router = new Router();

const emoticonPath = '/1TB_Drive/NSNEST_PUBLIC/images/emoticon';

/**
 * 이모티콘 등록
 */
router.post('/emoticon', async (ctx, next) => { //토큰 검증
  const accessToken:string = ctx.request.header.accesstoken;
  if(!cognitoJWT.check(accessToken?accessToken:'', true)){  //토큰 검증 실패
    console.error("토큰 검증 실패");
    ctx.body = {
      result: false,
      message: "토큰 검증 실패"
    };
    return false;
  } 

  await next();
}, koaBody({  //이미지 저장
    formidable:{
      uploadDir: emoticonPath, // directory where files will be uploaded
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
    const emoticonName:string = ctx.request.header.emoticonName;
    console.log('OQ emoticonName - ' + emoticonName);
    const redis = new redisDB();
    let client = redis.getClient();
    client.hset();

    ctx.body = {
      result: true,
      message: ctx.request.body
    };
  }
);

export default router.routes();