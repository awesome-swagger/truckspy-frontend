import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { EntityTypeUtil, Notification, RestService } from '@app/core/services';

@Component({
  selector: '[activitiesNotification]',
  templateUrl: './activities-notification.component.html',
})
export class ActivitiesNotificationComponent implements OnInit {

  @Input() item: Notification;
  @Output() removeAction = new EventEmitter();

  constructor(private restService: RestService) { }

  ngOnInit() {
  }

  acknowledgeMe() {
    let notificationId = this.item.id;
    this.restService.acknowledgeNotification(notificationId)
      .subscribe(data => {
        this.removeAction.emit(notificationId);
      });
  }

  setClasses() {
    let classes = {
      'fa fa-fw fa-2x': true
    };
    let type = EntityTypeUtil.getEntityType(this.item.entityType);
    classes[EntityTypeUtil.getFAIcon(type)] = true;
    return classes
  }

  setURI() {
    let type = EntityTypeUtil.getEntityType(this.item.entityType);
    return EntityTypeUtil.getURI(type, this.item.entityId);
  }

}
