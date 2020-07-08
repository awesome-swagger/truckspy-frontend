import { Component, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Store } from '@ngrx/store';

import { RestService, Reportable, Company, FilterParams, DataTableService, LocalStorageService, FuelStatistics } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-fuel',
  templateUrl: './fuel.component.html',
  styleUrls: ['./fuel.component.css']
})
export class FuelComponent implements OnInit {

  @ViewChild("transactionsTable") transactionsTable: any;

  company: Company;
  entity: Reportable;
  entities: Reportable[] = [];
  entitiesLoaded = false;
  statistics: FuelStatistics;

  onEntityChange(value): void {
    this.entity = value;
    this.transactionsTable.ajaxReload();
    this.loadFuelStatistics();
  }

  /**
   * Transactions table related logic.
   */
  tableLength: number;
  orderColumns = ["posDate", null, null, null, null, null];
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
        let vehicle = full.vehicle;
        if (!vehicle || !vehicle.id) {
          return "";
        }
        var remoteId = vehicle.remoteId || "(unspecified)";
        var id = vehicle.id;
        return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
      }
    },
    { data: "quantity", orderable: false, defaultContent: "" },
    { data: "pricePer", orderable: false, defaultContent: "" },
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
        let isCompany = this.company.id === this.entity.id;
        let entityId = isCompany ? null : this.entity.id;
        this.restService.getAllFuelTransactions(params, this.tableLength, entityId)
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
      order: [[ 0, 'desc' ]]
    };
  }

  /**
   * Constructor to instantiate an instance of FuelComponent.
   */
  constructor(
    private store: Store<any>,
    private restService: RestService,
    private currencyPipe: CurrencyPipe,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private lsService: LocalStorageService) { }


  ngOnInit() {
    this.restService.getCompany()
      .subscribe(
        company => {
          this.entities.push(company);
          this.company = company;
          this.entity = company;

          // load reporting profiles
          this.restService.get1000ReportingProfiles()
            .subscribe(profiles => {
              profiles.forEach(p => {
                this.entities.push(p);
              });

              this.entitiesLoaded = true;
            });

          this.loadFuelStatistics();

          let loggedInAs = this.lsService.getLoginAs();
          this.store.select(getTableLength).subscribe((length: number) => {
            this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
            this.defineOptions();
          });
        }
      );
  }

  loadFuelStatistics() {
    this.restService.getFuelStatistics(this.entity.id)
      .subscribe(statistics => {
        this.statistics = statistics;
      });
  }

}
