import { MESSAGES_PAGESIZE } from '@app/core/smartadmin.config';
import { Injectable } from '@angular/core';
import { plainToClass } from 'class-transformer';

import { RestService, Message, Driver } from '@app/core/services';

export const ALL_DRIVERS = "All Drivers";

export interface DraftMessage {
    subject: string;
    body: string;
    receiverId?: string;
    draft: boolean;
}

@Injectable()
export class MessagesService {

    constructor(
        private restService: RestService) { }

    replyMessage(inboxMessage: Message) {
        return {
            reMessageId: inboxMessage.id,
            receiverId: inboxMessage.senderId,
            subject: `RE: ${inboxMessage.subject}`,
            body: ""
        }
    }

    storeMessage(message: Message, reply: boolean = false) {
        localStorage.setItem("message.details", JSON.stringify(message) || "");
        localStorage.setItem("message.details.reply", `${reply}`);
    }

    getMessage(): Message {
        let message = localStorage.getItem("message.details");
        return message ? plainToClass(Message, JSON.parse(message) as Message) : null;
    }

    isReply(): boolean {
        let reply = localStorage.getItem("message.details.reply");
        return !!reply && reply == "true";
    }

    storeDraftMessage(message: Message) {
        localStorage.setItem("message.compose", JSON.stringify(message) || "");
    }

    clearDraftMessage(): void {
        localStorage.removeItem("message.compose");
    }

    getDraftMessage(): DraftMessage {
        let defaultMessage = {
            subject: "",
            body: "",
            receiverId: ""
        };
        let message = localStorage.getItem("message.compose");
        return !!message ? JSON.parse(message) : defaultMessage;
    }

    getDriverName(drivers: Driver[], id: string): string {
        if (!id) {
            return ALL_DRIVERS;
        }
        let theDriver = drivers.find(function (driver) {
            return driver.id === id;
        });
        let namePresented = !!theDriver && (!!theDriver.firstName || !!theDriver.lastName);
        return namePresented ? theDriver.name() : "null";
    }

    getRange(total: number, page: number) {
        if (total === 0) {
            return `none`;
        }
        let from = (page - 1) * MESSAGES_PAGESIZE + 1;
        let to = page * MESSAGES_PAGESIZE;
        if (to > total) {
            to = total;
        }
        return `${from}-${to}`;
    }

    getTotalPages(total: number): number {
        let totalPages = total / MESSAGES_PAGESIZE;
        if (totalPages * MESSAGES_PAGESIZE < total) {
            totalPages += 1;
        }
        return totalPages;
    }

}
