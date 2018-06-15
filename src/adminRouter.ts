import * as Router from 'koa-router';
import * as koaBody from 'koa-body';
import { environment } from "./json/environment";

import cognitoJWT from './cognitoJWT';

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
    const emoticonName:string = ctx.request.header.emoticonname;
    console.log('OQ emoticonName - ' + emoticonName);
    var redis = require("redis");
    let client = redis.createClient(environment.RedisPort, environment.RedisHost);
    client.sadd(environment.EmoNameSet, emoticonName);
    console.log('OQ image path - ' + JSON.stringify(ctx.request.body));
    client.rpush(emoticonName, 'testEmo');

    ctx.body = {
      result: true,
      message: ctx.request.body
    };
  }
);

export default router.routes();