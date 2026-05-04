export class SendMessageRequest{
    chat_id: string;
    user_message: string;
    constructor(chat_id:string , user_message:string){
        this.chat_id = chat_id;
        this.user_message = user_message; 
    }
}