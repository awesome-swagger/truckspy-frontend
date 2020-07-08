import { Input, OnChanges, NgZone, TemplateRef, Output, EventEmitter } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { RestService, Vehicle, FilterParams, DataTableService, OdometerAdjustment, GlobalFunctionsService } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-odometer',
  templateUrl: './odometer.component.html',
  styleUrls: ['./odometer.component.css']
})
export class OdometerComponent implements OnChanges {

  @Input() vehicle: Vehicle;
  @Output() actionHappened: EventEmitter<any> = new EventEmitter();

  @ViewChild("odometerTable") odometerTable: any;

  NO_VALID_DATA = "no valid data"
  hasRecords: boolean = false;

  /**
   * Ordering field names for DataTable columns.
   */
  orderColumns = ["datetime", null, "reason", null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return !full.datetime
          ? "N/A"
          : this.dateService.transformDateTime(full.datetime);
      }.bind(this)
    },
    { data: "odometer", orderable: false },
    { data: "reason", orderable: false },
    {
      data: null,
      className: "text-center",
      render: function (data, type, full, meta) {
        var odometerEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.deleteOdometer("${odometerEncoded}", this)'>delete</a>`;
      }.bind(this)
    }
  ];
  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllOdometerAdjustments(this.vehicle.id, params)
        .subscribe(
          data => {
            this.hasRecords = data && data.results && data.results.length > 0;
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          },
        );
    },
    columns: this.valueColumns
  };

  deleteOdometer(odometerEncoded: string, element: any) {
    this.ngZone.run(() => {
      var odometer = this.gfService.decodeParam(odometerEncoded);
      this.deleteOdometerPrivate(odometer, element);
    });
  }
  deleteOdometerPrivate(odometer: OdometerAdjustment, element: any) {
    var waitElement = document.createElement('span');
    waitElement.innerHTML = 'wait...';
    element.parentNode.replaceChild(waitElement, element);

    this.restService.deleteOdometerAdjustment(this.vehicle.id, odometer.id)
      .subscribe(
        good => {
          this.actionHappened.emit([]);
          this.odometerTable.ajaxReload();
        },
        error => {
          waitElement.parentNode.replaceChild(element, waitElement);
        }
      );
  }

  /**
   * Add Odometer Adjustment modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addOdometerModal: BsModalRef;
  odometerData = {
    date: new Date(),
    datetime: this.NO_VALID_DATA,
    odometer: 0.0,
    reason: ""
  };
  validDatetimes: string[] = [];

  onDateChange(value): void {
    let day = this.dateService.transform2OdometerDate(value);
    this.restService.getOdometerAdjustmentsDatetimesFor(this.vehicle.id, day)
      .subscribe(
        data => {
          this.validDatetimes = data;
          this.odometerData.datetime = (this.validDatetimes && this.validDatetimes.length > 0) ? this.validDatetimes[0] : this.NO_VALID_DATA;
        }
      );
  }

  addOdometer(template: TemplateRef<any>) {
    this.odometerData = {
      date: new Date(),
      datetime: this.NO_VALID_DATA,
      odometer: 0.0,
      reason: ""
    };
    this._addOdometerModal = this.modalService.show(template, { class: "modal-450" });
    this.onDateChange(this.odometerData.date);
  }

  createOdometer(): void {
    let data = {
      vehicleId: this.vehicle.id,
      odometer: this.odometerData.odometer,
      reason: this.odometerData.reason || "",
      datetime: this.odometerData.datetime
    }
    this.restService.createOdometerAdjustment(this.vehicle.id, data)
      .subscribe(
        data => {
          this._addOdometerModal.hide();
          // In case of empty table - this will show hided table (edge case)
          this.hasRecords = true;
          this.actionHappened.emit([]);
          if (this.odometerTable) {
            this.odometerTable.ajaxReload();
          }
        }
      );
  }
  closeAddOdometerModal(): void {
    this._addOdometerModal.hide();
  }

  /**
   * Constructor to instantiate an instance of OdometerComponent.
   */
  constructor(
    private gfService: GlobalFunctionsService,
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private dateService: DateService) {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.deleteOdometer = this.deleteOdometer.bind(this);

    this.loadData();
  }

  ngOnChanges() {
    this.loadData();
  }

  loadData() {
    if (this.vehicle && this.vehicle.id) {
      let params: FilterParams = new FilterParams(1, `datetime.DESC`);
      this.restService.getAllOdometerAdjustments(this.vehicle.id, params)
        .subscribe(
          data => {
            this.hasRecords = data && data.results && data.results.length > 0;
          },
        );
    }
  }

}
