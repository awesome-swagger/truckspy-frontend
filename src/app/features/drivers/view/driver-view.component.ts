import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { Driver, RestService, ReportingProfileHistory, ReportingProfile, DispatchGroup, Attribute } from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';

@Component({
  selector: 'app-driver-view',
  templateUrl: './driver-view.component.html',
  styleUrls: ['./driver-view.component.css']
})
export class DriverViewComponent implements OnInit {

  @ViewChild("appReportsTable") appReportsTable: any;

  driverId: string;
  driver: Driver = new Driver();
  loaded: boolean = false;
  dispatchGroupAssignable: boolean = false;

  period(history: ReportingProfileHistory): string {
    let start = this.dateService.transformDateTime(history.startedAt);
    let end = (history.endedAt && this.dateService.transformDateTime(history.endedAt)) || "Present";
    return `${start} - ${end}`;
  }

  /**
   * Reassign Driver modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _reassignModal: BsModalRef;
  reassignData = {
    reportingProfileId: null,
    asOf: new Date()
  };
  reportingProfiles: ReportingProfile[];

  reassign(template: TemplateRef<any>) {
    this.reassignData = {
      reportingProfileId: (this.reportingProfiles && this.reportingProfiles.length >= 1 && this.reportingProfiles[0].id) || "",
      asOf: new Date()
    };
    this._reassignModal = this.modalService.show(template, { class: "" });
  }

  doReassign(): void {
    let data = {
      reportingProfileId: this.reassignData.reportingProfileId,
      asOf: this.dateService.transform4Backend(this.reassignData.asOf)
    }
    this.restService.assignDriverToReportingProfile(this.driverId, data)
      .subscribe(
        data => {
          this._reassignModal.hide();
          this.driver = data;
          this.appReportsTable.reloadReports();
        }
      );
  }
  closeReassignModal(): void {
    this._reassignModal.hide();
  }

  /**
   * Assign Dispatch Group modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignDispatchGroupModal: BsModalRef;
  assignDispatchGroupData = {
    dispatchGroupId: null
  };
  dispatchGroups: DispatchGroup[];

  assignDispatchGroup(template: TemplateRef<any>) {
    this.assignDispatchGroupData = {
      dispatchGroupId: (this.dispatchGroups && this.dispatchGroups.length >= 1 && this.dispatchGroups[0].id) || "",
    };
    this._assignDispatchGroupModal = this.modalService.show(template, { class: "modal-sm" });
  }

  doAssignDispatchGroup(): void {
    this.restService.assignDispatchGroupToDriver(this.driverId, this.assignDispatchGroupData.dispatchGroupId)
      .subscribe(
        data => {
          this._assignDispatchGroupModal.hide();
          this.driver = data;
        }
      );
  }
  closeAssignDispatchGroupModal(): void {
    this._assignDispatchGroupModal.hide();
  }

  /**
   * Unassign Dispatch Group logic.
   */
  unassignDispatchGroup(group: DispatchGroup, actionComponent: LongActionLinkComponent) {
    this.restService.unassignDispatchGroupFromDriver(this.driverId, group.id)
      .subscribe(
        good => {
          this.restService.getDriver(this.driverId)
            .subscribe(result => {
              this.driver = result;
            });
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Toggle Driver's Status modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _toggleStatusModal: BsModalRef;

  toggleStatus(template: TemplateRef<any>) {
    this._toggleStatusModal = this.modalService.show(template, { class: "modal-sm" });
  }
  doToggleStatus(): void {
    this.restService.toggleStatus(this.driverId)
      .subscribe(
        data => {
          this._toggleStatusModal.hide();
          this.driver = data;
          this.appReportsTable.reloadReports();
        }
      );
  }
  closeToggleStatusModal(): void {
    this._toggleStatusModal.hide();
  }

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService) { }

  ngOnInit() {
    this.driverId = this.route.snapshot.paramMap.get("id");
    this.restService.getDriver(this.driverId)
      .subscribe(result => {
        this.loaded = true;
        this.driver = result;
      });
    this.restService.get1000ReportingProfileLights()
      .subscribe(result => {
        this.reportingProfiles = result;
      });
    this.restService.get1000DispatchGroupsLight()
      .subscribe(result => {
        this.dispatchGroups = result;
        this.dispatchGroupAssignable = this.dispatchGroups && this.dispatchGroups.length > 0;
      });
  }

  /**
   * Edit Driver modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _editDriverModal: BsModalRef;
  driverData = {
    canEdit: false,
    firstName: "",
    lastName: "",
    remoteId: "",
    username: "",
    newPassword: "",
    attributes: []
  };

  editDriver(template: TemplateRef<any>) {
    this.driverData = {
      canEdit: this.driver.canEdit,
      firstName: this.driver.firstName,
      lastName: this.driver.lastName,
      remoteId: this.driver.remoteId,
      username: this.driver.username || "",
      newPassword: this.driver.newPassword,
      attributes: this.driver.editableAttributes.map((attr: Attribute) => ({
        name: attr.name,
        value: attr.value || "",
      }))
    };
    this._editDriverModal = this.modalService.show(template, { class: "modal-450" });
  }

  doUpdate(): void {
    let data = {
      firstName: this.driverData.firstName,
      lastName: this.driverData.lastName,
      username: this.driverData.username,
      newPassword: this.driverData.newPassword
    }
    if (this.driverData.canEdit) {
      data["remoteId"] = this.driverData.remoteId;
    }

    this.restService.updateDriverAttributes(this.driver.id, this.driverData.attributes)
      .subscribe(
        success => {
          this.restService.updateDriver(this.driver.id, data)
            .subscribe(
              data => {
                this._editDriverModal.hide();

                this.driver = data;
                this.appReportsTable.reloadReports();
              });
        });
  }
  closeEditDriverModal(): void {
    this._editDriverModal.hide();
  }

}
