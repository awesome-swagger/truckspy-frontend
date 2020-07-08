import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';

import { RestService, FilterParams, DataTableService, EntityType } from '@app/core/services'
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

/**
 * By default dwell events are fetched for the `Location` entity type.
 */
@Component({
  selector: 'app-dwellevents',
  templateUrl: './dwellevents.component.html'
})
export class DwellEventsComponent implements OnInit {

  @Input() entityId: string;
  @Input() entityType: string;
  isVehicle: boolean;

  orderColumns = ["id", "startedAt", "endedAt", "duration"];
  valueColumns = [
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        function getVehicleLink(vehicle) {
          if (!!vehicle && !!vehicle.id) {
            var remoteId = vehicle.remoteId || "(unspecified)";
            var id = vehicle.id;
            return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
          }
          return "";
        }
        function getLocationLink(location) {
          if (!!location && !!location.id) {
            var name = location.name || "(unspecified)";
            var id = location.id;
            return `<a href="#/location/list/${id}/view">${name}</a>`;
          }
          return "";
        }
        return this.isVehicle ? getLocationLink(full.location) : getVehicleLink(full.vehicle);
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDwellDateTime(full.startedAt);
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDwellDateTime(full.endedAt);
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDwellDuration(full.duration);
      }.bind(this)
    }
  ];
  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        let observable = this.isVehicle
          ? this.restService.getDwellEventsForVehicle.bind(this.restService)
          : this.restService.getDwellEventsForLocation.bind(this.restService);
        observable(this.entityId, params)
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
      order: [[ 1, 'desc' ]]
    };
  }

  /**
   * Constructor to instantiate an instance of DwellEventsComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService) { }

  ngOnInit() {
    this.isVehicle = EntityType.VEHICLE === this.entityType;
    this.defineOptions();
  }

}
