var FCM = require('fcm-node');
var serverKey = require('path/to/privatekey.json'); //put the generated private key path here    
var fcm = new FCM(serverKey);

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