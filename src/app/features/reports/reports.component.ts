import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularMultiSelect } from 'angular2-multiselect-dropdown';

import { RestService, DateUtil, ReportType, ReportTypeUtil, ReportEntity, ReportingProfile, EntityTypeUtil, EntityType } from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

  timeEnabled = false;
  profiles: ReportingProfile[] = [];
  reportTypes: ReportType[] = [];
  reportNames: string[] = [];
  fileTypes: string[] = ["PDF", "EXCEL"];
  reportData = {
    reportName: null,
    period: [null, null],
    fileType: this.fileTypes[0]
  }

  downloadReport() {
    let start = this.dateService.transform4Backend(this.reportData.period[0]);
    let end = this.dateService.transform4Backend(this.reportData.period[1]);

    this.restService.buildCustomReport(this.selectedEntities, this.reportData.reportName,
      start, end, this.reportData.fileType);
  }

  /**
   * Constructor to instantiate an instance of ReportsComponent.
   */
  constructor(
    private restService: RestService,
    private dateService: DateService) { }

  ngOnInit() {
    this.restService.get1000ReportingProfiles()
      .subscribe(
        profiles => {
          this.profiles = profiles;
          this.restService.getReportTypes()
            .subscribe(
              types => {
                this.reportTypes = types;
                this.reportNames = ReportTypeUtil.getReportNames(types);
                if (this.reportNames && this.reportNames.length > 0) {
                  this.reportData.reportName = this.reportNames[0];
                }
              });
        });
  }

  /**
   * To workaround Select All checkbox issue.
   */
  @ViewChild("multiselect") multiselect: AngularMultiSelect;

  onModelChange(entities: any) {
    // console.log(entities);
    // if (this.totalEntities > 0 && this.selectedEntities.length === this.totalEntities && this.dropdownSettings.enableCheckAll) {
    //   this.multiselect.isSelectAll = false;
    //   this.multiselect.toggleSelectAll();
    // }
  }

  /**
   * Report entities and multiselect logic.
   */
  needLoadSubjects = true;
  totalEntities: number = 0;
  selectedEntities: ReportEntity[] = [];
  reportEntities: ReportEntity[] = [];

  resetDropdown() {
    this.needLoadSubjects = true;
    this.totalEntities = 0;
    this.selectedEntities = [];
    this.reportEntities = [];
  }

  onReportNameChange(newValue) {
    this.resetDropdown();
  }

  periodCache: Date[] = [null, null];
  onPeriodChange(state) {
    if (!this.timeEnabled && !!state.value[1]) {
      DateUtil.setEOD(state.value[1]);
    }

    let valueChanged = DateUtil.compareDate(this.periodCache[0], state.value[0]) != 0 ||
      DateUtil.compareDate(this.periodCache[1], state.value[1]) != 0;
    this.periodCache = [...state.value];

    if (valueChanged) {
      this.resetDropdown();
    }

    let periodDefined = !!state.value[0] && !!state.value[1];
    this.dropdownSettings = {
      ...this.dropdownSettings,
      disabled: !periodDefined
    }
  }

  loadReportSubjects($event: any) {
    if (!this.needLoadSubjects) {
      return;
    }
    let start = this.dateService.transform4Backend(this.reportData.period[0]);
    let end = this.dateService.transform4Backend(this.reportData.period[1]);

    this.multiselect.loading = true;
    this.restService.getReportEntities(this.reportData.reportName, start, end)
      .subscribe(
        subjects => {
          this.multiselect.loading = false;
          let companyName = null;
          let checkAll = false;
          this.totalEntities = 0;

          let filteredSubjects = [];
          subjects.forEach((next: any) => {
            /*
             * Subjects are of 3 levels (in terms of grouping):
             * 1. Company - 1-st level subject (optional)
             * 2. Reporting Profiles - 2-nd level subjects
             * 3. Vehicles, Drivers, etc. - 3-rd level ones.
             * 
             * We want to show `Select All` checkbox in cases when Company is presented.
             * In that case we want to use company name as `Select All` label.
             * No need to manage Login As case since company (its name) is returned as part of the subjects.
             */
            let type: EntityType = EntityTypeUtil.getEntityType(next.entityType);
            if (type === EntityType.COMPANY) {
              checkAll = true;
              companyName = next.name;
            } else if (type === EntityType.REPORTING_PROFILE) {
              // just ignore here - will be shown as a group name
            } else { // regular cases - 3-rd level
              this.totalEntities += 1;

              let theProfile = this.profiles.find(function (profile: ReportingProfile) {
                return profile.id === next.belongsTo;
              });
              if (!!theProfile) {
                next.belongsToName = theProfile.name;
              }
              filteredSubjects.push(next);
            }
          });

          if (checkAll) {
            this.dropdownSettings = {
              ...this.dropdownSettings,
              enableCheckAll: true,
              selectAllText: `${companyName} (Select All)`,
              unSelectAllText: `${companyName} (Select None)`
            }
          } else {
            this.dropdownSettings = {
              ...this.dropdownSettings,
              enableCheckAll: false
            }
          }
          this.reportEntities = filteredSubjects;
          this.needLoadSubjects = false;
        },
        () => {
          this.multiselect.loading = false;
        });
  }

  dropdownSettings = {
    disabled: true,
    singleSelection: false,
    enableSearchFilter: false,
    enableCheckAll: false,
    badgeShowLimit: 3,
    labelKey: "name",
    primaryKey: "entityId",
    groupBy: "belongsToName",
    classes: "myclass multiselect-32px",
    text: "Select...",
    selectAllText: 'Select All',
    unSelectAllText: 'Select None'
  };

  /**
   * Report Detail page.
   */
  showDetails: boolean = false;
  reportName: string;

  hideDetails() {
    this.showDetails = false;
    this.reportName = null;
  }

  doShowDetails(report: string) {
    this.showDetails = true;
    this.reportName = report;
    if (this.reportData.reportName != report) {
      this.resetDropdown();
    }
    this.reportData.reportName = report;
  }

}
