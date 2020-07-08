import { Input, OnChanges } from '@angular/core';
import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { RestService, Vehicle, FilterParams, DataTableService, FuelStatistics } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-vehicle-fuel',
  templateUrl: './fuel.component.html',
  styleUrls: ['./fuel.component.css']
})
export class VehicleFuelComponent implements OnChanges {

  @Input() vehicle: Vehicle;

  hasRecords: boolean = false;
  statistics: FuelStatistics;

  /**
   * Ordering field names for DataTable columns.
   */
  orderColumns = ["posDate", null, null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.posDate);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.locationName) {
          return `${full.locationState}`;
        } else {
          return !!full.locationState ? `${full.locationName}, ${full.locationState}` : `${full.locationName}`;
        }
      }
    },
    { data: "quantity", orderable: false, defaultContent: "" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let quantity = full.quantity;
        let pricePer = full.pricePer;
        if (quantity == null || pricePer == null) {
          return "";
        }
        return this.currencyPipe.transform(quantity * pricePer);
      }.bind(this)
    },
  ];
  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllVehicleFuelTransactions(this.vehicle.id, params)
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
    columns: this.valueColumns,
    order: [[ 0, 'desc' ]]
  };

  /**
   * Constructor to instantiate an instance of VehicleFuelComponent.
   */
  constructor(
    private restService: RestService,
    private currencyPipe: CurrencyPipe,
    private dataTableService: DataTableService,
    private dateService: DateService) {
    this.loadData();
  }

  ngOnChanges() {
    this.loadData();
  }

  loadData() {
    if (this.vehicle && this.vehicle.id) {
      this.restService.getFuelStatistics(this.vehicle.id)
        .subscribe(statistics => {
          this.statistics = statistics;
        });

      let params: FilterParams = new FilterParams(1, `posDate.DESC`);
      this.restService.getAllVehicleFuelTransactions(this.vehicle.id, params)
        .subscribe(
          data => {
            this.hasRecords = data && data.results && data.results.length > 0;
          },
        );
    }
  }

}
