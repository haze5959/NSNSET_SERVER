var FCM = require('fcm-node');
var fcm = new FCM('AAAAb4Trr0Y:APA91bFqh9qhQG67dOFWeMx3pqJ3_OW638ZeOGZzOBBFHpUnRHLrQLfnp_DyRNDlx_npQSrq9u0PfACaSElcMaDLyOvunXHr1TENI0C9LHC9Y_GPCgQ9Ir8A2a99IRPs4hj8jT5CCF1B');

export default class FCMClass {
  constructor() {  
  }

  /**
   * @param topic 
   * @param userName 
   * @param messageType 10: 게시글 / 20: 댓글
   */
  public sendWithTopic(topic, userName, messageType:number) {
    let title = `${userName}님이 게시글을 올렸습니다.`;
    if(messageType == 20){
      title = `${userName}님이 댓글을 올렸습니다.`;
    }

    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: `/topics/${topic}`, 
        
        notification: {
            title: title,
            body: '',
            click_action:"FCM_PLUGIN_ACTIVITY"
        },
        
        data: {  //you can send only notification or only data(or include both)
            type: messageType,
            user: userName
        }
    }
    
    fcm.send(message, function(err, response){
        if (err) {
            console.error("Something has gone wrong! - " + err)
        } else {
            console.log("Successfully sent with response: ", response)
        }
    })
  }    
}