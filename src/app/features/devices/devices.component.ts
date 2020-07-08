import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from "@ngrx/store";

import { RestService, DataTableService, FilterParams, LocalStorageService } from '@app/core/services/rest.service';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ReplaceUnderscorePipe } from '@app/shared/pipes/utils.pipe';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit {

  @ViewChild("devicesTable") devicesTable: any;

  tableLength: number;
  orderColumns = ["iccid", "type", "imei", null, null, "softwareVersion", null, null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/devices/${full.id}/view">${full.iccid}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        let deviceType = full.type;
        return !!deviceType ? this.replaceUnderscore.transform(deviceType) : "";
      }.bind(this)
    },
    { data: "imei" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.reportingProfile && full.reportingProfile.id) {
          return `<a href="#/reporting/${full.reportingProfile.id}/view">${full.reportingProfile.name}</a>`;
        }
        return "";
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.lastVehicle && full.lastVehicle.id) {
          var remoteId = full.lastVehicle.remoteId || "(unspecified)";
          var id = full.lastVehicle.id;
          return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
        }
        return "";
      }
    },
    { data: "softwareVersion" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let datetime = full.lastVehicle && full.lastVehicle.lastPosition && full.lastVehicle.lastPosition.datetime;
        if (!!datetime) {
          return this.dateService.transformDateTime(datetime);
        }
        return "";
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.isConnected();
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let dataErrorAt = full.lastVehicle && full.lastVehicle.dataErrorAt;
        if (!!dataErrorAt) {
          return this.dateService.transformDateTime(dataErrorAt);
        }
        return "";
      }.bind(this)
    },
  ];

  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllDevices(params, this.tableLength)
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
  }

  /**
   * Constructor to instantiate an instance of DevicesComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private replaceUnderscore: ReplaceUnderscorePipe,
    private store: Store<AuthState>,
    private dateService: DateService,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  ngOnInit() { }

}
