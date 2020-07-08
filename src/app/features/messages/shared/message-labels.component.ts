import { Component, OnInit, Input } from '@angular/core';

import { Message } from '@app/core/services';

@Component({
  selector: 'message-labels',
  template: `<span *ngIf="message && message.status && message.toDriver()" class="label bg-color-{{LABELS[message.status].color}}" style="margin-right: 5px;">
      {{LABELS[message.status].name}}
    </span>
    <span *ngIf="message && message.fromDriver()" class="label bg-color-greenLight" style="margin-right: 5px;">
      INBOX
    </span>`
})
export class MessageLabelsComponent implements OnInit {

  @Input() message: Message;

  public LABELS = {
    Sent: {
      name: "SENT",
      color: "teal"
    },
    Pending: {
      name: "PENDING",
      color: "orange"
    }
  };

  constructor() { }

  ngOnInit() { }

}
