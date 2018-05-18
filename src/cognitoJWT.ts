import * as jwt from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import { jwt_set } from "./json/jwt_set";
import { environment } from "./json/environment";
import { relative } from 'path';

const userPool_Id = "https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_PzeoW49Lp";

export default class cognitoJWT {
  static check(userToken:string){
    const pems = {};
    for(let i = 0; i<jwt_set.keys.length; i++){
      const jwk = {
        kty: jwt_set.keys[i].kty,
        n: jwt_set.keys[i].n,
        e: jwt_set.keys[i].e
      };

      // convert jwk object into PEM
      const pem = jwkToPem(jwk);
      // append PEM to the pems object, with the kid as the identifier
      pems[jwt_set.keys[i].kid] = pem;
    }

    this.ValidateToken(pems, userToken)
    .then((data)=>{
      console.log(data)
      return true;  //성공
    })
    .catch((err)=>{
      console.log(err)
      return false; //실패
    })
  }


  static ValidateToken(pems, jwtToken:string){
    const p = new Promise((res, rej)=>{
      const decodedJWT = jwt.decode(jwtToken, {complete: true});
      // reject if its not a valid JWT token
      if(!decodedJWT){
        console.log("Not a valid JWT token");
        rej("Not a valid JWT token");
      }
      // reject if ISS is not matching our userPool Id
      if(decodedJWT['payload']['iss'] != userPool_Id){
        console.log("invalid issuer")
        rej({
        message: "invalid issuer",
        iss: decodedJWT['payload']
        })
      }
      // Reject the jwt if it's not an 'Access Token'
      if (decodedJWT['payload']['token_use'] != 'access') {
            console.log("Not an access token")
            rej("Not an access token")
        }
          // Get jwtToken `kid` from header
      const kid = decodedJWT['header']['kid'];
      // check if there is a matching pem, using the `kid` as the identifier
      const pem = pems[kid];
      // if there is no matching pem for this `kid`, reject the token
      if(!pem){
        console.log('Invalid access token')
        rej('Invalid access token')
      }
      console.log("Decoding the JWT with PEM!")
      // verify the signature of the JWT token to ensure its really coming from your User Pool
      jwt.verify(jwtToken, pem, {issuer: userPool_Id}, function(err, payload){
        if(err){
        console.log("Unauthorized signature for this JWT Token")
        rej("Unauthorized signature for this JWT Token")
        }else{
        // if payload exists, then the token is verified!
        res(payload)
        }
      })
    });
    return p
   }
}