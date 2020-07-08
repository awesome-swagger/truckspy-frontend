import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ModalDirective, BsModalRef, BsModalService } from 'ngx-bootstrap';

import { RestService, Device, ReportingProfile } from '@app/core/services'
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-device-view',
  templateUrl: './device-view.component.html',
  styleUrls: ['./device-view.component.css']
})
export class DeviceViewComponent implements OnInit {

  deviceId: string;
  device: Device = new Device();

  /**
   * Reassign Device modal reference to operate with within component.
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
    this.restService.assignDeviceToReportingProfile(this.deviceId, data)
      .subscribe(
        data => {
          this._reassignModal.hide();
          this.device = data;
        }
      );
  }
  closeReassignModal(): void {
    this._reassignModal.hide();
  }

  /**
   * Deactivate Device modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _deactivateModal: BsModalRef;
  deactivateData = {
    deviceIdConfirmation: null
  };
  actionConfirmed: boolean = false;

  deactivate(template: TemplateRef<any>) {
    this.deactivateData = {
      deviceIdConfirmation: ""
    };
    this._deactivateModal = this.modalService.show(template, { class: "modal-450" });
  }

  confirmationListener(newValue) {
    this.actionConfirmed = newValue === this.device.iccid;
  }

  doDeactivate(): void {
    if (this.deactivateData.deviceIdConfirmation != this.device.iccid) { // equal to `this.actionConfirmed` technically
      return;
    }
    this.restService.deactivateDevice(this.deviceId)
      .subscribe(
        success => {
          this.restService.getDevice(this.deviceId)
            .subscribe(result => {
              this._deactivateModal.hide();
              this.device = result;
            });
        }
      );
  }
  closeDeactivateModal(): void {
    this._deactivateModal.hide();
  }

  /**
   * Constructor to instantiate an instance of ReportingViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService) { }

  ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get("id");
    this.restService.getDevice(this.deviceId)
      .subscribe(result => {
        this.device = result;
      });
    this.restService.get1000ReportingProfileLights()
      .subscribe(result => {
        this.reportingProfiles = result;
      });
  }

}
