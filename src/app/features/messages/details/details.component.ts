import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { RestService, Message } from '@app/core/services';
import { MessagesService, ALL_DRIVERS } from '../shared/messages.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  driverName: string = "";
  message: Message;
  fromDriver: boolean = false;

  /**
   * Acknowledge logic.
   */
  acknowledging: boolean = false;
  acknowledge() {
    this.restService.acknowledgeMessage(this.message.id)
      .subscribe(
        success => {
          this.message.markAcknowledged();
          this.messagesService.storeMessage(this.message);
          this.acknowledging = false; // no need in this, just for consistency
        },
        error => {
          this.acknowledging = false;
        }
      );
  }

  /**
   * Acknowledge logic.
   */
  archiving: boolean = false;
  archive() {
    this.restService.archiveMultipleMessages([this.message.id])
      .subscribe(
        success => {
          this.message.markArchived();
          this.messagesService.storeMessage(this.message);
          this.archiving = false; // no need in this, just for consistency
        },
        error => {
          this.archiving = false;
        }
      );
  }

  /**
   * Acknowledge logic.
   */
  unarchiving: boolean = false;
  unarchive() {
    this.restService.unarchiveMultipleMessages([this.message.id])
      .subscribe(
        success => {
          this.message.markUnarchived();
          this.messagesService.storeMessage(this.message);
          this.unarchiving = false; // no need in this, just for consistency
        },
        error => {
          this.unarchiving = false;
        }
      );
  }

  /**
   * Reply logic.
   */
  reply: boolean = false;
  replyData: any = {
    subject: "",
    body: ""
  };

  discardReply() {
    this.reply = false;
    this.replyData = this.messagesService.replyMessage(this.message);
  }

  drafting: boolean = false;
  sending: boolean = false;
  resetButtons() {
    this.drafting = false;
    this.sending = false;
  }

  createReplyMessage() {
    let isDraft = this.drafting;
    let messageData = {
      ...this.replyData,
      draft: isDraft
    }

    this.restService.createMessage(messageData)
      .subscribe(
        success => {
          this.resetButtons();
          let path = isDraft ? "/messages/draft" : "/messages/sent";
          this.router.navigate([path]);
        },
        error => {
          this.resetButtons();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of DetailsComponent.
   */
  constructor(
    private router: Router,
    private restService: RestService,
    private messagesService: MessagesService) { }

  ngOnInit() {
    this.message = this.messagesService.getMessage();
    if (!this.message) {
      this.router.navigate(["/messages/inbox"]);
    }

    this.reply = this.messagesService.isReply();
    this.replyData = this.messagesService.replyMessage(this.message);

    this.fromDriver = this.message.fromDriver();
    if (this.fromDriver && !this.message.read) { // let's mark message as read
      this.restService.readMessage(this.message.id)
        .subscribe(success => { /* do nothing */ });
    }
    let driverId = this.fromDriver ? this.message.senderId : this.message.receiverId;

    if (!driverId) {
      this.driverName = ALL_DRIVERS;
    } else {
      this.restService.getDriver(driverId)
        .subscribe(
          driver => {
            this.driverName = this.messagesService.getDriverName([driver], driverId);
          }
        );
    }
  }

}
