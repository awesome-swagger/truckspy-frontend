import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { RestService, Driver } from '@app/core/services';
import {DraftMessage, MessagesService} from '../shared/messages.service';
import {map} from "rxjs/operators";

interface RecipientOption {
  id: string| null;
  displayName: string;
  disabled: boolean;
}

const ALL_DRIVERS_ID = 'ALL_DRIVERS';

const STATIC_RECIPIENT_OPTIONS: RecipientOption[] = [
  {
    id: '',
    displayName: 'Select a Recipient',
    disabled: true,
  },
  {
    id: ALL_DRIVERS_ID,
    displayName: 'All Drivers',
    disabled: false,
  }
];

@Component({
  selector: 'app-compose',
  templateUrl: './compose.component.html',
  styleUrls: ['./compose.component.css']
})
export class ComposeComponent implements OnInit {

  recipientOptions: RecipientOption[] = [];
  message: DraftMessage;

  discard() {
    this.router.navigate(["/messages/inbox"]);
  }

  /**
   * Workaround for the SmartAdmin select2 wrapper.
   */
  receiverChanged(value) {
    this.message.receiverId = value
  }

  /**
   * Message creation logic.
   */
  drafting: boolean = false;
  sending: boolean = false;
  resetButtons() {
    this.drafting = false;
    this.sending = false;
  }

  createMessage() {
    let isDraft = this.drafting;
    const messagePersistenceModel = this.mapMessageUiToPersistence(this.message);
    let messageData = {
      ...messagePersistenceModel,
      draft: isDraft
    };

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
   * Constructor to instantiate an instance of ComposeComponent.
   */
  constructor(
    private router: Router,
    private restService: RestService,
    private messagesService: MessagesService) { }

  ngOnInit() {
    this.message = this.mapMessagePersistenceToUi(this.messagesService.getDraftMessage());

    this.restService.get1000ActiveDrivers().pipe(
      map((drivers: Driver[]) => {
        const driverOptions = drivers.map(driver => ({
          id: driver.id,
          displayName: driver.name(),
          disabled: false,
        }));
        return STATIC_RECIPIENT_OPTIONS.concat(driverOptions)
      })
    ).subscribe((recipients) => {
      this.recipientOptions = recipients;
    });
  }

  private mapMessagePersistenceToUi(model: DraftMessage): DraftMessage {
    let receiverId = model.receiverId;
    if (!receiverId && model.draft) {
      receiverId = ALL_DRIVERS_ID;
    }

    return Object.assign({}, model, {receiverId: receiverId});
  }

  private mapMessageUiToPersistence(model: DraftMessage): DraftMessage {
    let receiverId = model.receiverId;
    if (receiverId === ALL_DRIVERS_ID) {
      receiverId = "";
    }

    return Object.assign({}, model, {receiverId: receiverId})
  }
}
