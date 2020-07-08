import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { RestService, DataTableService, FilterParams, Company, LocalStorageService, Status } from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getConfigCompany } from '@app/core/store/config';
import { LoggedInAs, LoggedOutAs, getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.css']
})
export class DriversComponent implements OnInit {

  /**
   * Status filtering logic.
   */
  status: string = Status.ACTIVE;
  isActiveTab() {
    return this.status === Status.ACTIVE;
  }
  showActive() {
    this.status = Status.ACTIVE;
    this.driversTable.ajaxReload();
  }
  showDeleted() {
    this.status = Status.DELETED;
    this.driversTable.ajaxReload();
  }

  tableLength: number;
  orderColumns = ["remoteId", "firstName", null, "status"];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var remoteId = full.remoteId || "(unspecified)";
        var id = full.id;
        return `<a href="#/drivers/${id}/view">${remoteId}</a>`;
      }
    },
    { data: "name" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let date = full.lastTimeEntry && full.lastTimeEntry.startedAt;
        return this.dateService.transformDateTime(date);
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
        this.restService.getAllDrivers(params, this.status, this.tableLength)
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

  constructor(
    private store: Store<any>,
    private actions$: Actions,
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
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
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();
  }

  /**
   * Add Driver modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addDriverModal: BsModalRef;
  driverData = {
    firstName: "",
    lastName: "",
    remoteId: "",
    username: "",
    newPassword: ""
  };

  company: Company;
  loginAsCompany: Company;
  @ViewChild("driversTable") driversTable: any;

  addDriver(template: TemplateRef<any>) {
    this.driverData = {
      firstName: "",
      lastName: "",
      remoteId: "",
      username: "",
      newPassword: ""
    };

    this._addDriverModal = this.modalService.show(template, { class: "modal-400" });
  }

  doCreate(): void {
    this.restService.createDriver(this.driverData)
      .subscribe(
        data => {
          this._addDriverModal.hide();
          this.driversTable.ajaxReload();
        }
      );
  }
  closeAddDriverModal(): void {
    this._addDriverModal.hide();
  }

}
