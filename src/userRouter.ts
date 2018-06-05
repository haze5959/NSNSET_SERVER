import * as Router from 'koa-router';
import oracleDB from './oracleDB';
import cognitoJWT from './cognitoJWT';

const router = new Router();

/**
 * GET
 */
router.get('/', async (ctx) => {  
  const param = ctx.request.query;
  const db = new oracleDB();
  // console.log("[ctx.params] : " + JSON.stringify(param));
  if(param['userId']){ //해당 유저 아이디에 해당하는 유저 정보 가져오기
    let userId = param['userId'];
    await db.getConnection()
    .then(con => {
      return con.execute('SELECT * FROM USERS WHERE USER_ID = :userId', {userId: userId})
      .then(result => {
        ctx.body = result.rows;
        // console.log("[response] : " + ctx.body);
        con.release();
      }, err => {
        con.release();
        throw err;
      });
    }).catch(err => {
      ctx.body = err.message;
      console.error("[error] : " + ctx.body);
    });
  } else {  //모든 유저 정보 가져오기
    var sort = param['sort']?param['sort']:'stNum';
    let count:number = param['count']?param['count']:5;

    if (sort == "update") {  //활동순
      sort = 'RECENT_DATE';
    } else {  //잉여 포인트순 rank
      sort = 'POINT';
    }

    await db.getConnection()
    .then(con => {
      return con.execute('SELECT * FROM USERS ORDER BY :sort desc OFFSET 0 ROWS FETCH NEXT :maxnumrows ROWS ONLY', { sort: sort, maxnumrows: count})
      .then(result => {
        ctx.body = result.rows;
        // console.log("[response] : " + ctx.body);
        con.release();
      }, err => {
        con.release();
        throw err;
      });
    }).catch(err => {
      ctx.body = err.message
      console.error("[error] : " + ctx.body);
    });
  }

});

router.get('/cognito', async (ctx) => {  
  const param = ctx.request.query;
  // console.log("[ctx.params] : " + JSON.stringify(param));

  let cognitoSub = param['cognitoSub'];
  if(!cognitoSub){ 
    ctx.body = "코그니토 정보가 없습니다.";
    return false;
  }

  const db = new oracleDB();
  let connection = await db.getConnection()
  .then(con => {
    return con;
  }).catch(err => {
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + JSON.stringify(ctx.body));
    return null;
  });

  if(!connection){
    //통신 종료
    return false;
  }

  let isExistUser = true;
  //유저 검색================================================
  await connection.execute('SELECT * FROM USERS WHERE USER_COGNITO_SUB = :cognitoSub', { cognitoSub: cognitoSub })
  .then(result => {
    if(result.rows.length > 0){ //유저가 있다면
      ctx.body = result.rows;
      // console.log("[response] : " + ctx.body);
      connection.release();
    } else {  //유저가 없다면 새로 등록한다.
      isExistUser = false;
    }
    
  }, err => {
    throw err;

  }).catch(err => {
    connection.release();
    ctx.body = err.message
    console.error("[error] : " + ctx.body);
  });
  //================================================================

  if(!isExistUser){
    //유저 등록================================================
    let userName = param['name'];
    let userBirthDay = param['birthDay'];
    let userGender = param['gender'];
    let studentNum = param['studentNum'];

    await connection.execute(`INSERT INTO USERS 
    (USER_ID, RECENT_DATE, USER_NAME, USER_INTRO, STUDENT_NUM, IMAGE, SUBIMAGE, POINT, USER_DESC, USER_COGNITO_SUB, BIRTHDAY, GENDER) 
    VALUES (SEQ_ID.NEXTVAL, SYSDATE, :userName, '', :studentNum, '', '', 0, '', :cognitoSub, :userBirthDay, :userGender)`,
    { userName: userName, studentNum: studentNum, cognitoSub: cognitoSub, userBirthDay: userBirthDay, userGender: userGender })
    .then(result => {
      console.log("[new user] : " + userName);
      connection.commit();
    }, err => {
      throw err;

    }).catch(err => {
      connection.rollback();
      connection.release();
      ctx.body = err.message
      console.error("[error] : " + ctx.body);
    });
    //================================================================

    //유저 검색================================================
    await connection.execute('SELECT * FROM USERS WHERE USER_COGNITO_SUB = :cognitoSub', { cognitoSub: cognitoSub })
    .then(result => {
      if(result.rows.length > 0){ //유저가 있다면
        ctx.body = result.rows;
        // console.log("[response] : " + ctx.body);
        connection.release();
      } else {  //유저가 없음
        throw new Error('유저를 찾지 못하였습니다.');
      }
    }, err => {
      throw err;

    }).catch(err => {
      connection.release();
      ctx.body = err.message
      console.error("[error] : " + ctx.body);
    });
    //================================================================
  }
});

/**
 * PUT
 */
router.put('/', async (ctx) => {  
  const param = ctx.body;
  // console.log("[ctx.params] : " + JSON.stringify(param));
  
  if(!cognitoJWT.check(param['accessToken']?param['accessToken']:'')){  //토큰 검증 실패
    console.error("토큰 검증 실패");
    ctx.body = "토큰 검증 실패";
    return false;
  } 
  const payload = param['payload'];

  if(!payload){
    ctx.body = "페이로드가 없습니다.";
    return false;
  }

  let userId = payload.userId;
  let intro = payload.intro;
  let description = payload.description;
  let profileImage = payload.profileImage;

  const db = new oracleDB();
  let connection = await db.getConnection()
  .then(con => {
    return con;
  }).catch(err => {
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + JSON.stringify(ctx.body));
    return null;
  });

  if(!connection){
    //통신 종료
    return false;
  }
  
  //유저 정보 수정================================================
  await connection.execute(`UPDATE USERS SET USER_INTRO = :intro, USER_DESC = :description, IMAGE = :profileImage WHERE USER_ID = :userId`, 
  { userId: userId, intro: intro, description: description, profileImage: profileImage })
  .then(result => {
    //성공
    connection.release();
    ctx.body = {
      result: true,
      message: result
    };
  }, err => {
    throw err;

  }).catch(err => {
    connection.rollback();
    connection.release();
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + ctx.body);
    return false;
  });
  //================================================================
});

/**
 * DELETE
 */
router.delete('/', async (ctx) => {  

  const param = ctx.request.query;
  // console.log("[ctx.params] : " + JSON.stringify(param));
  let userId = param.userId;

  const db = new oracleDB();
  let connection = await db.getConnection()
  .then(con => {
    return con;
  }).catch(err => {
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + JSON.stringify(ctx.body));
    return null;
  });

  if(!connection){
    //통신 종료
    return false;
  }

  //유저 삭제================================================
  await connection.execute(`DELETE FROM USERS WHERE USER_ID = :userId`, 
  { userId: userId })
  .then(result => {
    //성공
    connection.release();
    ctx.body = {
      result: true,
      message: result
    };
  }, err => {
    throw err;

  }).catch(err => {
    connection.rollback();
    connection.release();
    ctx.body = {
      result: false,
      message: err.message
    };
    console.error("[error] : " + ctx.body);
  });
  //================================================================
});

export default router.routes();