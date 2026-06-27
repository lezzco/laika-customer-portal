export class SendMessageRequest{
    chat_id: string;
    user_message: string;
    company_id: string;
    constructor(chat_id:string , user_message:string, company_id: string){
        this.chat_id = chat_id;
        this.user_message = user_message; 
        this.company_id = company_id;
    }
}

export interface UpdateReadStatusRequest {
    updates: Record<string, string[]>;
}

export class HumanResponseRequest {
    chat_id: string;
    human_message: string;

    constructor(chat_id: string, human_message: string) {
        this.chat_id = chat_id;
        this.human_message = human_message;
    }
}

export interface HandoffRequest {
    chat_id: string;
}