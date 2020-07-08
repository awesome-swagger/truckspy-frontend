import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDirective } from 'ngx-bootstrap';

import { RestService, NotificationSettingsList, NotificationType, EntityTypeUtil, NotificationSettings, SupportedEntity } from '@app/core/services'

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css']
})
export class NotificationSettingsComponent implements OnInit {

  nsList: NotificationSettingsList;
  nsTypes: NotificationType[];
  hierarchy: any;

  /**
   * Remove Notification Settings modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("removeSettingsModal") _removeSettingsModal: ModalDirective;
  forSettings: NotificationSettings;

  initRemoveSettingsModal(settings: NotificationSettings) {
    this.forSettings = settings;
    this._removeSettingsModal.show();
  }
  closeRemoveSettingsModal() {
    this._removeSettingsModal.hide();
  }

  removeSettings(settingsId: string) {
    this.restService.deleteNotificationSettings(settingsId)
      .subscribe(result => {
        this._removeSettingsModal.hide();
        this.loadNotificationSettings();
      });
  }

  /**
   * Add Notification Settings modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addSettingsModal: BsModalRef;
  settingsData = {};
  notificationTypes: string[];
  entities: SupportedEntity[];
  communicationTypes: string[];
  supportedAttributes: string[];

  reportReadyData: any;
  reportNames: string[];
  fileTypes: string[];

  addSettings(template: TemplateRef<any>) {
    this.settingsData = {
      notificationType: (this.notificationTypes && this.notificationTypes.length >= 1 && this.notificationTypes[0]) || ""
    };
    this.onTypeChange(this.settingsData["notificationType"]);
    this._addSettingsModal = this.modalService.show(template, { class: "modal-sm" });
  }

  isReportReady() {
    return this.settingsData["notificationType"] === "Report_Ready"
  }
  onTypeChange(newType) {
    let type = this.nsTypes.find(function (nsType) {
      return newType === nsType.notificationType;
    });
    this.supportedAttributes = type.supportedAttributes;
    this.communicationTypes = type.supportedCommunications;
    this.settingsData["communicationType"] = (this.communicationTypes && this.communicationTypes.length >= 1 && this.communicationTypes[0]) || ""

    this.entities = type.supportedEntities;
    this.settingsData["entity"] = (this.entities && this.entities.length >= 1 && this.entities[0]) || null;
    this.onEntityChange(this.settingsData["entity"]);
  }
  onEntityChange(newEntity: SupportedEntity) {
    if (this.isReportReady()) {
      this.restService.getReport_ReadyValidSettingsFor(newEntity.entityId)
        .subscribe(
          data => {
            this.reportReadyData = data;
            this.reportNames = data.map(next => next.reportName);
            this.settingsData["reportName"] = (this.reportNames && this.reportNames.length >= 1 && this.reportNames[0]) || ""
            console.log(this.reportNames);
            console.log(this.settingsData["reportName"]);
            this.onReportNameChange(this.settingsData["reportName"]);
          },
          error => {
            this.reportReadyData = [];
            this.reportNames = [];
            this.fileTypes = [];
            this.settingsData["reportName"] = null;
            this.settingsData["fileType"] = null;
          }
        );
    } else {
      this.reportReadyData = [];
      this.reportNames = [];
      this.fileTypes = [];
      this.settingsData["reportName"] = null;
      this.settingsData["fileType"] = null;
    }
  }
  onReportNameChange(newReportName) {
    let entry = this.reportReadyData.find(function (next) {
      return newReportName === next.reportName;
    });
    this.fileTypes = entry.fileTypes;
    this.settingsData["fileType"] = (this.fileTypes && this.fileTypes.length >= 1 && this.fileTypes[0]) || "";
  }

  createSettings(): void {
    let data = {
      notificationType: this.settingsData["notificationType"],
      communicationType: this.settingsData["communicationType"],
      entityId: this.settingsData["entity"].entityId,
      entityType: this.settingsData["entity"].entityType,
      attributes: {}
    }
    if (this.settingsData["reportName"]) {
      data.attributes = {
        reportName: this.settingsData["reportName"],
        fileType: this.settingsData["fileType"],
      }
    }
    this.restService.createNotificationSettings(data)
      .subscribe(
        data => {
          this._addSettingsModal.hide();
          this.loadNotificationSettings();
        }
      );
  }
  closeAddSettingsModal(): void {
    this._addSettingsModal.hide();
  }

  /**
   * Constructor to instantiate an instance of NotificationSettingsComponent.
   */
  constructor(
    private restService: RestService,
    private modalService: BsModalService) { }

  calculateURI(theMap) {
    let type = EntityTypeUtil.getEntityType(theMap.entityType);
    return EntityTypeUtil.getURI(type, theMap.entityId);
  }

  ngOnInit() {
    this.restService.getNotificationSettingsTypes()
      .subscribe(
        types => {
          this.nsTypes = types;
          this.notificationTypes = this.nsTypes.map(type => type.notificationType);
          this.loadNotificationSettings();
        }
      );
  }

  private loadNotificationSettings() {
    this.restService.getNotificationSettingsList()
      .subscribe(
        list => {
          this.nsList = list;
          this.hierarchy = this.nsList.prepareUIHierarchy(this.nsTypes);
        }
      );
  }

}
