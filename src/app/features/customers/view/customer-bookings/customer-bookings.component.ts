import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { RestService, DataTableService, FilterParams, BookingStatus, Stop } from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-customer-bookings',
  templateUrl: './customer-bookings.component.html',
  styleUrls: ['./customer-bookings.component.css']
})
export class CustomerBookingsComponent implements OnInit {

  customerId: string;
  @ViewChild("bookingsTable") bookingsTable: any;

  /**
   * Status filtering logic.
   */
  status: string = BookingStatus.AVAILABLE;
  statuses = BookingStatus;
  showAvailable() {
    this.status = BookingStatus.AVAILABLE;
    this.bookingsTable.ajaxReload();
  }
  showDispatched() {
    this.status = BookingStatus.DISPATCHED;
    this.bookingsTable.ajaxReload();
  }
  showCompleted() {
    this.status = BookingStatus.COMPLETED;
    this.bookingsTable.ajaxReload();
  }
  showAll() {
    this.status = BookingStatus.ALL;
    this.bookingsTable.ajaxReload();
  }

  tableLength: number;
  orderColumns = ["bookNo", null, null, null, null, null, "status"];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/bookings/${full.id}/view">${full.bookNo}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let firstStop: Stop = full.getFirstStop();
        let isLocation = !!firstStop && firstStop.isLocation();
        return isLocation
          ? `<a href="#/location/list/${firstStop.location.id}/view">${firstStop.location.name}</a>`
          : firstStop.address.getAddress();
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let firstStop = full.getFirstStop();
        return !!firstStop ? this.dateService.transformDateTime(firstStop.arriveDate) : "";
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let lastStop: Stop = full.getLastStop();
        let isLocation = !!lastStop && lastStop.isLocation();
        return isLocation
          ? `<a href="#/location/list/${lastStop.location.id}/view">${lastStop.location.name}</a>`
          : lastStop.address.getAddress();
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let lastStop = full.getLastStop();
        return !!lastStop ? this.dateService.transformDateTime(lastStop.arriveDate) : "";
      }.bind(this)
    },
    { data: "status" }
  ];

  options = {
    // scrollY: "354px",
    noToolbar: true,
    processing: true,
    serverSide: true,
    pageLength: this.tableLength,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllBookingsFor(this.customerId, params, this.status, this.tableLength)
        .subscribe(
          data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          }
        );
    },
    columns: this.valueColumns
  };

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService) { }

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get("id");
  }

}
