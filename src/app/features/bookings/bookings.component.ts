import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  RestService, DataTableService, FilterParams, LocalStorageService, BookingStatus, Stop, VehicleType,
  Customer, FeedbackType, StopLoadType, DomicileLocation
} from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {

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
        let customer = full.customer;
        return `<a href="#/customers/${customer.id}/view">${customer.name}</a>`;
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

  options: any;
  defineOptions() {
    this.options = {
      // scrollY: "354px",
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllBookings(params, this.status, this.tableLength)
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
      columns: this.valueColumns,
      order: [[0, 'desc']]
    };
  }

  constructor(
    private store: Store<any>,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  ngOnInit() {
    this.restService.get1000FeedbackTypes()
      .subscribe(result => {
        this.feedbackTypes = result;

        this.restService.get1000Customers()
          .subscribe(result => {
            this.customers = result;
            this.customersLoaded = true;
          });
        this.restService.get1000VehicleTypes()
          .subscribe(result => {
            this.types = result;
            this.typesLoaded = true;
          });
        this.restService.get1000Locations()
          .subscribe(result => {
            this.locations = result;
          });
      });
  }

  /**
   * Add Booking logic.
   */
  customers: Customer[];
  customersLoaded: boolean = false;
  types: VehicleType[];
  typesLoaded: boolean = false;
  feedbackTypes: FeedbackType[];
  locations: DomicileLocation[] = [];

  refreshBookingsTable() {
    this.bookingsTable.ajaxReload();
  }

}
