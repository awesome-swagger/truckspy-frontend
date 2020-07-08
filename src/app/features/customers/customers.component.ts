import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Store } from "@ngrx/store";
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { RestService, DataTableService, FilterParams, LocalStorageService } from '@app/core/services/rest.service';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { AddressUtil } from '@app/features/shared/address-input.component';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {

  @ViewChild("customersTable") customersTable: any;

  tableLength: number;
  orderColumns = ["name", null, "createdAt", "phone"];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/customers/${full.id}/view">${full.name}</a>`;
      }
    },
    {
      data: "status",
      orderable: false
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.createdAt);
      }.bind(this)
    },
    { data: "phone" }
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
        this.restService.getAllCustomers(params, this.tableLength)
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
   * Add Customer modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addCustomerModal: BsModalRef;
  customerData = {
    name: "",
    phone: "",
    physicalAddress: this.addressUtil.defaultAddress(),
    billingAddress: this.addressUtil.defaultAddress()
  };

  addCustomer(template: TemplateRef<any>) {
    this.customerData = {
      name: "",
      phone: "",
      physicalAddress: this.addressUtil.defaultAddress(),
      billingAddress: this.addressUtil.defaultAddress()
    };

    this._addCustomerModal = this.modalService.show(template, { class: "modal-400" });
  }

  doCreate(): void {
    this.restService.createCustomer(this.customerData)
      .subscribe(
        data => {
          this._addCustomerModal.hide();
          this.customersTable.ajaxReload();
        }
      );
  }
  closeAddCustomerModal(): void {
    this._addCustomerModal.hide();
  }

  /**
   * Constructor to instantiate an instance of CustomersComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private dateService: DateService,
    private store: Store<AuthState>,
    private addressUtil: AddressUtil,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  ngOnInit() {
  }

}
