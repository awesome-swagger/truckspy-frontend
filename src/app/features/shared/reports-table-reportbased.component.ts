import { Component, Input, OnChanges, ViewChild, NgZone, OnInit, OnDestroy } from '@angular/core';

import { RestService, FilterParams, DataTableService, GlobalFunctionsService, EntityType, EntityTypeUtil, ReportEntity } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
    selector: 'app-reports-table-reportbased',
    template:
        `<div class="panel panel-default">
        <div class="panel-heading">
            <div style="width: 60%" class="pull-left">Reports</div>
            <div style="width: 40%" class="pull-right" *ngIf="hasEntities">
                <ng-select class="to-default" name="entity" id="entity"
                    [items]="entities" bindLabel="name" [clearable]="false"
                    [(ngModel)]="entity" dropdownPosition="bottom" (ngModelChange)="onEntityChange($event)">
                    <ng-template ng-option-tmp let-item="item" let-index="index" let-search="searchTerm">
                        <span [ngOptionHighlight]="search">{{item.name}}</span>
                    </ng-template>
                </ng-select>
            </div>
            <div class="clearfix"></div>
        </div>

        <div class="panel-body" *ngIf="!hasEntities">
            <div class="form-horizontal">
                <i>No reports available</i>
            </div>
        </div>
        <div class="panel-body no-padding override-child-dataTable-margin" *ngIf="hasEntities">
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
export class ReportsTableReportbasedComponent implements OnChanges, OnInit, OnDestroy {

    @Input() reportName: string;

    @ViewChild("reportsTable") reportsTable: any;

    entities: ReportEntity[];
    entity: ReportEntity;
    hasEntities: boolean;
    loadedOnce: boolean;

    onEntityChange(value): void {
        this.reportsTable.ajaxReload();
    }

    reloadReports(): void {
        if (this.reportsTable) {
            this.reportsTable.ajaxReload();
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
            this.restService.getReports(this.entity.entityId, this.reportName, params)
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
     * Constructor to instantiate an instance of ReportsTableReportbasedComponent.
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
        if (!this.reportName) {
            return;
        }
        if (this.loadedOnce) {
            return;
        }

        // Period of [now-year; now]
        let end = this.dateService.transform4Backend(this.dateService.getCurrentTime());
        let yearEarlier = this.dateService.getCurrentTime();
        yearEarlier.setFullYear(yearEarlier.getFullYear() - 1);
        let start = this.dateService.transform4Backend(yearEarlier);

        this.restService.getReportEntities(this.reportName, start, end)
            .subscribe(
                subjects => {
                    let firstLevel = [];
                    let secondLevel = [];
                    let thirdLevel = [];
                    subjects.forEach((next: ReportEntity) => {
                        /*
                         * Subjects are of 3 levels:
                         * 1. Company - 1-st level subject (optional)
                         * 2. Reporting Profiles - 2-nd level subjects
                         * 3. Vehicles, Drivers, etc. - 3-rd level ones.
                         * 
                         * We want to show them in the select element in such order.
                         */
                        let type: EntityType = EntityTypeUtil.getEntityType(next.entityType);
                        if (type === EntityType.COMPANY) {
                            firstLevel.push(next);
                        } else if (type === EntityType.REPORTING_PROFILE) {
                            secondLevel.push(next);
                        } else { // regular cases - 3-rd level
                            thirdLevel.push(next);
                        }
                    });

                    this.entities = [...firstLevel, ...secondLevel, ...thirdLevel];
                    this.hasEntities = !!this.entities && this.entities.length > 0;
                    if (this.hasEntities) {
                        this.entity = this.entities[0];
                        this.loadedOnce = true;
                    }
                });
    }

}
