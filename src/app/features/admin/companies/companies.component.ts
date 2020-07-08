import { Component, OnInit, ViewChild, NgZone, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Store } from '@ngrx/store';

import { RestService, FilterParams, DataTableService, GlobalFunctionsService, LocalStorageService, User } from '@app/core/services'
import { ConfigState } from '@app/core/store/config';
import * as fromAuth from '@app/core/store/auth';
import { getTableLength } from '@app/core/store/auth';
import { plainToClass } from 'class-transformer';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { AmountHandlerPipe } from '@app/shared/pipes/utils.pipe';
import { AddressUtil } from '@app/features/shared/address-input.component';

@Component({
  selector: 'app-admin-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css']
})
export class CompaniesComponent implements OnInit {

  @ViewChild("companiesTable") companiesTable: any;

  tableLength: number;
  orderColumns = ["name", null, null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var name = full.name || "(unspecified)";
        var id = full.id;
        return `<a href="#/admin/companies/${id}/view">${name}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let result = "";
        if (full.users && full.users.length > 0) {
          var companyEncoded = this.gfService.encodeParam(full);
          full.users.forEach(function (user, index, array) {
            var userEncoded = this.gfService.encodeParam(user);
            result += `<a onclick='truckspy.loginAs("${userEncoded}", "${companyEncoded}")'>${user.name()}</a>`;
            if (index !== array.length - 1) {
              result += ", ";
            }
          }.bind(this));
        }
        return result;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.currencyPipe.transform(this.amountHandler.transform(full.mRR));
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let date = full.lastInvoice && full.lastInvoice.date;
        return !!date ? this.dateService.transformDate(date) : "N/A";
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
        this.restService.getAllCompanies(params, this.tableLength)
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
   * Login as functionality.
   */
  loginAs(userEncoded: string, companyEncoded: string) {
    this.ngZone.run(() => {
      var user = this.gfService.decodeParam(userEncoded);
      var company = this.gfService.decodeParam(companyEncoded);
      this.loginAsPrivate(user, company);
    });
  }
  loginAsPrivate(user: any, company: any) {
    this.lsService.storeLoginAsInfo(user, company);
    let userObject: User = plainToClass(User, user as User);
    this.store.dispatch(new fromAuth.LoggedInAs());
    let home = userObject.getEntryPoint();
    this.router.navigate([home]);
  }

  /**
   * Add Company modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addCompanyModal: BsModalRef;
  companyData: any = {};
  userData = {};

  addCompany(template: TemplateRef<any>) {
    this.companyData = {
      name: "",
      address: this.addressUtil.defaultAddress(),
    }
    this.userData = {
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
    };
    this._addCompanyModal = this.modalService.show(template, { class: "modal-sm" });
  }

  createCompany(): void {
    let companyData = {
      name: this.companyData.name,
      address1: this.companyData.address.line1,
      address2: this.companyData.address.line2,
      city: this.companyData.address.city,
      state: this.companyData.address.state,
      zip: this.companyData.address.zip,
      country: this.companyData.address.country
    }

    this.restService.createCompany(companyData, this.userData)
      .subscribe(
        data => {
          this._addCompanyModal.hide();
          this.companiesTable.ajaxReload();
        }
      );
  }
  closeCompanyModal(): void {
    this._addCompanyModal.hide();
  }

  /**
   * Constructor to instantiate an instance of CompaniesComponent.
   */
  constructor(
    private router: Router,
    private restService: RestService,
    private dataTableService: DataTableService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private modalService: BsModalService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService,
    private amountHandler: AmountHandlerPipe,
    private currencyPipe: CurrencyPipe,
    private addressUtil: AddressUtil,
    private dateService: DateService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.loginAs = this.loginAs.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.loginAs = null;
  }

}
