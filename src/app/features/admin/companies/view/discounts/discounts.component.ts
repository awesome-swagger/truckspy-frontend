import { Component, OnInit, NgZone, ViewChild, TemplateRef } from '@angular/core';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import { RestService, FilterParams, DataTableService, GlobalFunctionsService, DiscountType } from '@app/core/services'

@Component({
  selector: 'app-admin-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.css']
})
export class AdminDiscountsComponent implements OnInit {

  @ViewChild("discountsTable") discountsTable: any;
  companyId: string;

  orderColumnsDiscounts = ["name", "type", null, null, null, null, null];
  valueColumnsDiscounts = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.name;
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.titleCase.transform(full.type);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let isFlat = full.type === DiscountType.FLAT;
        let amount = isFlat ? this.currencyPipe.transform(full.context.availableDiscountAmount) : `${full.context.discountPercent || 0}%`;
        return amount;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.context && full.context.availableDiscountApplying || "";
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return "";
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return "";
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.applicable) {
          return "";
        }
        var discountEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.cancelDiscountModal("${discountEncoded}")'>Cancel</a>`;
      }.bind(this)
    }
  ];
  optionsDiscounts = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsDiscounts);
      this.restService.getAllDiscountsFor(this.companyId, params)
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
    columns: this.valueColumnsDiscounts
  };

  /**
   * Add Discount modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addDiscountModal: BsModalRef;
  discountData = {
    name: "",
    type: "",
    amount: null,
    allowedUses: null
  };
  discountTypes: string[] = Object.values(DiscountType);

  addDiscount(template: TemplateRef<any>) {
    this.discountData = {
      name: "",
      type: this.discountTypes[0],
      amount: null,
      allowedUses: null
    };
    this._addDiscountModal = this.modalService.show(template, { class: "modal-sm" });
  }

  createDiscount(): void {
    let dData = {
      name: this.discountData.name,
      type: this.discountData.type,
      context: {
        availableDiscountApplying: this.discountData.allowedUses
      }
    }
    if (this.discountData.type === DiscountType.FLAT) {
      dData.context["availableDiscountAmount"] = this.discountData.amount;
    } else {
      dData.context["discountPercent"] = this.discountData.amount;
    }

    this.restService.createDiscount(this.companyId, dData)
      .subscribe(
        data => {
          this._addDiscountModal.hide();
          this.discountsTable.ajaxReload();
        }
      );
  }
  closeDiscountModal(): void {
    this._addDiscountModal.hide();
  }

  /**
   * Cancel Discount modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("cancelDiscountModal") _cancelDiscountModal: ModalDirective;
  discountToCancel = {
    id: "",
    name: ""
  };

  cancelDiscountModal(discountEncoded: string) {
    this.ngZone.run(() => {
      var discount = this.gfService.decodeParam(discountEncoded);
      this.cancelDiscountModalPrivate(discount);
    });
  }
  cancelDiscountModalPrivate(discount: any) {
    this.discountToCancel = {
      id: discount.id,
      name: discount.name
    }
    this._cancelDiscountModal.show();
  }

  closeCancelDiscountModal() {
    this._cancelDiscountModal.hide();
  }
  doCancel() {
    this.restService.deleteDiscount(this.companyId, this.discountToCancel.id)
      .subscribe(
        success => {
          this._cancelDiscountModal.hide();
          this.discountsTable.ajaxReload();
        }
      );
  }

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private dataTableService: DataTableService,
    private datepipe: DatePipe,
    private titleCase: TitleCasePipe,
    private currencyPipe: CurrencyPipe,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.cancelDiscountModal = this.cancelDiscountModal.bind(this);

    this.companyId = this.route.snapshot.paramMap.get("id");
  }

  ngOnDestroy() {
    window.truckspy.cancelDiscountModal = null;
  }

}
