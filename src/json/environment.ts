// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  //Cognito 관련
  region: 'ap-northeast-2',
  IdentityPoolId: '',
  UserPoolId: 'ap-northeast-2_PzeoW49Lp',
  ClientId: '7k319206hpp5uleb2gorm1tncj',
  
  fileUrl: 'http://nsnest.iptime.org:3000/',
  EmoNameSet: 'emoNameSet',
  RedisPort: 6379,
  RedisHost: "0.0.0.0"
};
