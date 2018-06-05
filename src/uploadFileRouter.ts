import * as Router from 'koa-router';
import * as koaBody from 'koa-body';
import * as fs from 'fs';
import * as fx from 'mkdir-recursive';
import cognitoJWT from './cognitoJWT';

const router = new Router();

const profilePath = '/1TB_Drive/NSNEST_PUBLIC/images/profile';
const elbumPath = '/1TB_Drive/NSNEST_PUBLIC/images/elbum/18_06';

/**
 * 앨범 등록
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

  await next();
}, koaBody({  //이미지 저장
    formidable:{
      uploadDir: elbumPath, // directory where files will be uploaded
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

/**
 * 프로필 등록
 */
router.post('/profile', async (ctx, next) => { //토큰 검증
  const accessToken:string = ctx.request.header.accesstoken;
  if(!cognitoJWT.check(accessToken?accessToken:'')){  //토큰 검증 실패
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
      uploadDir: profilePath, // directory where files will be uploaded
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