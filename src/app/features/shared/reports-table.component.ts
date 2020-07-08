import { Component, Input, OnChanges, ViewChild, NgZone, OnInit, OnDestroy } from '@angular/core';

import { Reportable, RestService, FilterParams, DataTableService, GlobalFunctionsService } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
    selector: 'app-reports-table',
    template:
        `<div class="panel panel-default">
        <div class="panel-heading">
            <div style="width: 40%" class="pull-left">Reports</div>
            <div style="width: 60%" class="pull-right" *ngIf="hasReports">
                <select style="width: 60%" [(ngModel)]="productType" (ngModelChange)="onTypeChange($event)">
                    <option *ngFor="let type of productTypes" [value]="type">{{type | replaceUnderscore}}</option>
                </select>
                &nbsp;
                <select style="width: 35%" [(ngModel)]="reportName" (ngModelChange)="onNameChange($event)">
                    <option *ngFor="let name of reportNames" [value]="name">{{name | replaceUnderscore}}</option>
                </select>
            </div>
            <div class="clearfix"></div>
        </div>

        <div class="panel-body" *ngIf="!hasReports">
            <div class="form-horizontal">
                <i>No reports available</i>
            </div>
        </div>
        <div class="panel-body no-padding override-child-dataTable-margin" *ngIf="hasReports">
            <sa-datatable #reportsTable [options]="optionsReports" tableClass="table table-striped table-bordered table-hover">
                <thead>
                    <tr>
                        <th class="col-sm-4">Start Date</th>
                        <th class="col-sm-4">End Date</th>
                        <th class="col-sm-4"></th>
                    </tr>
                </thead>
            </sa-datatable>
        </div>
    </div>`
})
export class ReportsTableComponent implements OnChanges, OnInit, OnDestroy {

    @Input() entity: Reportable;

    @ViewChild("reportsTable") reportsTable: any;

    productTypes: string[];
    productType: string;
    reportNames: string[];
    reportName: string;
    hasReports: boolean;
    loadedOnce: boolean;

    onTypeChange(value): void {
        this.reportNames = this.entity.getReportNames(value);
        this.reportName = this.reportNames.length > 0 ? this.reportNames[0] : "";
        this.reportsTable.ajaxReload(true);
    }

    onNameChange(value): void {
        this.reportsTable.ajaxReload(true);
    }

    reloadReports(): void {
        if (this.reportsTable) {
            this.reportsTable.ajaxReload();
        }
    }

    reloadReportsFor(entity: Reportable): void {
        this.entity = entity;
        this.loadedOnce = false;
        this.loadData();
        if (this.reportsTable) {
            this.reportsTable.ajaxReload(true);
        }
    }

    /**
     * Ordering field names for DataTable columns.
     */
    orderColumnsReports = ["reportName", "reportName", "reportName"];
    valueColumnsReports = [
        {
            data: null,
            orderable: false,
            render: function (data, type, full, meta) {
                let startDate = !full.reportPeriod || !full.reportPeriod.startedAt
                    ? "N/A"
                    : this.dateService.transformDate(full.reportPeriod.startedAt);
                return startDate;
            }.bind(this)
        },
        {
            data: null,
            orderable: false,
            render: function (data, type, full, meta) {
                let endDate = !full.reportPeriod || !full.reportPeriod.endedAt
                    ? "N/A"
                    : this.dateService.transformDate(full.reportPeriod.endedAt);
                return endDate;
            }.bind(this)
        },
        {
            data: null,
            orderable: false,
            render: function (data, type, full, meta) {
                if (!full.links) {
                    return "";
                }

                let result = "";
                if (full.links.PDF) {
                    var uriEncoded = this.gfService.encodeParam(full.links.PDF);
                    result += `<a onclick='truckspy.downloadReport("${uriEncoded}")'><i class="fa fa-file-pdf-o"></i>pdf</a>&nbsp;&nbsp;&nbsp;`;
                }
                if (full.links.EXCEL) {
                    var uriEncoded = this.gfService.encodeParam(full.links.EXCEL);
                    result += `<a onclick='truckspy.downloadReport("${uriEncoded}")'><i class="fa fa-file-excel-o"></i>excel</a>&nbsp;&nbsp;&nbsp;`;
                }
                if (full.links.ARCHIVE) {
                    var uriEncoded = this.gfService.encodeParam(full.links.ARCHIVE);
                    result += `<a onclick='truckspy.downloadReport("${uriEncoded}")'><i class="fa fa-file-archive-o"></i>zip</a>`;
                }
                return result;
            }.bind(this)
        }
    ];
    optionsReports = {
        noToolbar: true,
        processing: true,
        serverSide: true,
        ajax: (data, callback, settings) => {
            let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsReports);
            this.restService.getReports(this.entity.id, this.reportName, params)
                .subscribe(
                    data => {
                        callback({
                            aaData: data.results,
                            recordsTotal: data.resultCount,
                            recordsFiltered: data.resultCount
                        })
                    },
                    error => {
                        callback({
                            aaData: [],
                            recordsTotal: 0,
                            recordsFiltered: 0
                        })
                    }
                );
        },
        columns: this.valueColumnsReports
    };

    downloadReport(reportURIEncoded: string) {
        this.ngZone.run(() => {
            var reportURI = this.gfService.decodeParam(reportURIEncoded);
            this.downloadReportPrivate(reportURI);
        });
    }
    downloadReportPrivate(reportURI) {
        this.restService.doReportDownload(reportURI, null);
    }

    /**
     * Constructor to instantiate an instance of ReportsTableComponent.
     */
    constructor(
        private restService: RestService,
        private ngZone: NgZone,
        private gfService: GlobalFunctionsService,
        private dataTableService: DataTableService,
        private dateService: DateService) {
        this.loadData();
    }

    ngOnInit() {
        // define namespace functions
        window.truckspy = window.truckspy || {};
        window.truckspy.downloadReport = this.downloadReport.bind(this);
    }

    ngOnDestroy() {
        window.truckspy.downloadReport = null;
    }

    ngOnChanges() {
        this.loadData();
    }

    loadData() {
        if (this.loadedOnce) {
            return;
        }

        this.productTypes = (this.entity && this.entity.getProductTypes()) || [];
        this.hasReports = this.productTypes.length > 0;
        if (this.hasReports) {
            this.productType = this.productTypes[0];

            this.reportNames = this.entity.getReportNames(this.productType);
            this.reportName = this.reportNames.length > 0 ? this.reportNames[0] : "";

            this.loadedOnce = true;
        }
    }

}
