import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Map } from 'mapbox-gl';

import { RestService, DataTableService, FilterParams, EntityType, Vehicle, Company, LocalStorageService, Status } from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { HTMLGeneratorService } from '@app/shared/pipes/utils.pipe';
import { MinifyMenu } from '@app/core/store/layout';
import { mapConfig } from '@app/core/smartadmin.config';
import { getConfigCompany } from '@app/core/store/config';
import { LoggedInAs, LoggedOutAs, getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit {

  infoHeader: string;
  datetimeHeader: string;
  /**
   * We want dynamic headers to be set up on DataTable loaded (within callback).
   * Initial set up should be also done within #ngOnInit();
   *
   * @memberof VehiclesComponent
   */
  setupHeaders() {
    this.infoHeader = this.dataError ? "Error&nbsp;Message" : "Last&nbsp;Location";
    this.datetimeHeader = this.dataError ? "Error Datetime" : "Last&nbsp;Location Datetime";
  }

  /**
   * Status filtering logic.
   */
  status: string = Status.ACTIVE;
  dataError: boolean = false;
  isActiveTab() {
    return this.status === Status.ACTIVE;
  }
  showActive() {
    this.status = Status.ACTIVE;
    this.dataError = false;
    this.vehiclesTable.ajaxReload();
  }
  showDeleted() {
    this.status = Status.DELETED;
    this.dataError = false;
    this.vehiclesTable.ajaxReload();
  }
  showDataError() {
    this.dataError = true;
    this.vehiclesTable.ajaxReload();
  }

  tableLength: number;
  orderColumns = ["remoteId", null, "status", null, null, null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var remoteId = full.remoteId || "(unspecified)";
        var id = full.id;
        return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var reportingName = full.reportingProfile && full.reportingProfile.name;
        var reportingId = full.reportingProfile && full.reportingProfile.id;
        return reportingId ? `<a href="#/reporting/${reportingId}/view">${reportingName}</a>` : "N/A";
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        var status = full.status;
        var deletedAt = full.deletedAt;
        if (!deletedAt || status !== "(deleted)") {
          return status;
        }
        var tooltip = "Deleted at " + this.dateService.transformDateTime(deletedAt);
        return `<span title="${tooltip}">${status}</span>`;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.connectionBindList || full.connectionBindList.length === 0) {
          return "";
        }
        return full.connectionBindList
          .filter(bind => !!bind.connection)
          .map(function (bind: any) {
            return `<a href="#/company/connections/${bind.connection.id}/view">${bind.connection.name}</a>`;
          })
          .join(", ");
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return (full.domicileLocation && full.domicileLocation.name) || "";
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (this.dataError) {
          return (full.lastOperation && full.lastOperation.errorMessage) || "";
        }

        let noPosition: boolean = !full.lastPosition || !full.lastPosition.id;
        if (noPosition) {
          return "";
        }
        return full.lastPosition.getLocation();
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (this.dataError) {
          return this.dateService.transformDateTime(full.dataErrorAt);
        }

        let noPosition: boolean = !full.lastPosition || !full.lastPosition.id;
        if (noPosition) {
          return "";
        }
        let datetime = full.lastPosition.datetime;
        return this.dateService.transformDateTime(datetime);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.reportingProfile.activeSubscriptionsOf(EntityType.VEHICLE)
          .map((next) => this.htmlGenerator.productBadge(next.productType))
          .join(" ");
      }.bind(this)
    }
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
        this.restService.getAllVehicles(params, this.status, this.dataError, this.tableLength)
          .subscribe(
            data => {
              this.setupHeaders();
              callback({
                aaData: data.results,
                recordsTotal: data.resultCount,
                recordsFiltered: data.resultCount
              })
            }
          );
      },
      columns: this.valueColumns,
      rowCallback: function (row, data) {
        if (data.dataError) {
          $(row).addClass('danger');
        }
      }
    };
  }

  tabsState: string = "table";
  /**
   * Bounds definition for the map to fit.
   */
  fitBounds: number[][] = [];
  fitBoundsOptions = {
    padding: { top: 25, bottom: 25, left: 25, right: 25 }
  }
  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;

  theMapInstance: Map;
  onLoad(mapInstance: Map) {
    this.theMapInstance = mapInstance;
  }
  onMinifyMenu = this.actions$.subscribe(action => {
    if (action instanceof MinifyMenu) {
      this.theMapInstance.resize();
    }
  });

  calculateBounds(activeVehicles: Vehicle[]): number[][] {
    if (!activeVehicles || activeVehicles.length === 0) {
      // USA (without Alaska) bounds
      return [[-124.848974, 24.396308], [-66.885444, 49.384358]];
    }
    if (activeVehicles.length === 1) {
      let vehicle = activeVehicles[0];
      return [
        [vehicle.lastPosition.longitude - 0.25, vehicle.lastPosition.latitude - 0.25],
        [vehicle.lastPosition.longitude + 0.25, vehicle.lastPosition.latitude + 0.25]
      ];
    }
    let minLng = 181;
    let maxLng = -181;
    let minLat = 91;
    let maxLat = -91;
    activeVehicles.forEach(function (next) {
      if (minLng > next.lastPosition.longitude) {
        minLng = next.lastPosition.longitude;
      }
      if (maxLng < next.lastPosition.longitude) {
        maxLng = next.lastPosition.longitude;
      }
      if (minLat > next.lastPosition.latitude) {
        minLat = next.lastPosition.latitude;
      }
      if (maxLat < next.lastPosition.latitude) {
        maxLat = next.lastPosition.latitude;
      }
    });
    return [[minLng, minLat], [maxLng, maxLat]];
  }

  /**
   * Map styling logic.
   */
  style: string = mapConfig.STREETS;
  isDefault: boolean = true;
  toggleStyle() {
    this.style = this.isDefault ? mapConfig.SATELLITE : mapConfig.STREETS;
    this.isDefault = !this.isDefault;
  }

  /**
   * Constructor to instantiate an instance of VehiclesComponent.
   */
  constructor(
    private store: Store<any>,
    private actions$: Actions,
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private htmlGenerator: HTMLGeneratorService,
    private dateService: DateService,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loginAsCompany = this.lsService.getCompany();
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loginAsCompany = null;
    }
  });
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  ngOnInit() {
    this.setupHeaders();
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();

    this.restService.get1000Vehicles()
      .subscribe(result => {
        this.vehicles = result.filter(
          vehicle => vehicle.hasLastPosition());
        this.fitBounds = this.calculateBounds(this.vehicles);
        this.vehiclesLoaded = true;
      });
  }

  /**
   * Add Vehicle modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addVehicleModal: BsModalRef;
  vehicleData = {
    remoteId: "",
    autoFix: true,
    year: "",
    make: "",
    model: "",
    vin: ""
  };

  company: Company;
  loginAsCompany: Company;
  @ViewChild("vehiclesTable") vehiclesTable: any;

  addVehicle(template: TemplateRef<any>) {
    this.vehicleData = {
      remoteId: "",
      autoFix: true,
      year: "",
      make: "",
      model: "",
      vin: ""
    };

    this._addVehicleModal = this.modalService.show(template, { class: "modal-450" });
  }

  doCreate(): void {
    this.restService.createVehicle(this.vehicleData)
      .subscribe(
        data => {
          this._addVehicleModal.hide();
          this.vehiclesTable.ajaxReload();
        }
      );
  }
  closeAddVehicleModal(): void {
    this._addVehicleModal.hide();
  }

}
