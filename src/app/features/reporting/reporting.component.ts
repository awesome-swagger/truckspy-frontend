import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Store, select } from "@ngrx/store";
import { take } from "rxjs/operators";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigState, getConfigReportends, getConfigTimezonesKeys, getConfigUnits } from '@app/core/store/config';
import { RestService, DataTableService, FilterParams, LocalStorageService } from '@app/core/services/rest.service';
import { HTMLGeneratorService } from '@app/shared/pipes/utils.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.css']
})
export class ReportingComponent implements OnInit {

  @ViewChild("reportingTable") reportingTable: any;

  tableLength: number;
  orderColumns = ["name", "entityName", "countVehicles", "countDrivers", "reportPeriodEnd", "defaultProfile"];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/reporting/${full.id}/view">${full.name}</a>`;
      }
    },
    { data: "entityName" },
    { data: "countVehicles", orderable: false },
    { data: "countDrivers", orderable: false },
    { data: "reportPeriodEnd" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let defaultHTML = full.defaultProfile ? this.htmlGenerator.defaultBadge() : "";
        return defaultHTML + " " + full.activeSubscriptions()
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
        this.restService.getAllReportingProfiles(params, this.tableLength)
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
   * Add Reporting Profile modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addReportingModal: BsModalRef;
  reportingData = {};
  periodEnds: string[];
  timeZones: string[];
  validUnits: string[];

  addReporting(template: TemplateRef<any>) {
    this.reportingData = {
      name: "",
      entityName: "",
      entityIdentifier: "",
      reportPeriodEnd: (this.periodEnds && this.periodEnds.length >= 1 && this.periodEnds[0]) || "",
      reportTimeZone: (this.timeZones && this.timeZones.length >= 1 && this.timeZones[0]) || "",
      units: (this.validUnits && this.validUnits.length >= 1 && this.validUnits[0]) || ""
    };
    this._addReportingModal = this.modalService.show(template, { class: "" });
  }

  createReporting(): void {
    this.restService.createReportingProfile(this.reportingData)
      .subscribe(
        data => {
          this._addReportingModal.hide();
          this.reportingTable.ajaxReload();
        }
      );
  }
  closeReportingModal(): void {
    this._addReportingModal.hide();
  }

  /**
   * Constructor to instantiate an instance of ReportingComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private htmlGenerator: HTMLGeneratorService,
    private modalService: BsModalService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  ngOnInit() {
    this.store.pipe(select(getConfigReportends), take(1)).subscribe(val => {
      this.periodEnds = val;
    });
    this.store.pipe(select(getConfigTimezonesKeys), take(1)).subscribe(val => {
      this.timeZones = val;
    });
    this.store.pipe(select(getConfigUnits), take(1)).subscribe(val => {
      this.validUnits = val;
    });
  }

}
