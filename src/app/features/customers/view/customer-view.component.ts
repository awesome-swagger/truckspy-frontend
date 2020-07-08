import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { Customer, RestService } from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnInit {

  customerId: string;
  customer: Customer = new Customer();
  loaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService) { }

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get("id");
    this.restService.getCustomer(this.customerId)
      .subscribe(result => {
        this.loaded = true;
        this.customer = result;
      });
  }

  /**
   * Toggle Customer's status logic.
   */
  doToggleStatus(customer: Customer, actionComponent: LongActionLinkComponent) {
    this.restService.setCustomerStatus(this.customerId, !this.customer.isActive())
      .subscribe(
        success => {
          this.restService.getCustomer(this.customerId)
            .subscribe(result => {
              this.customer = result;
              // this.bookingsTable.ajaxReload();
            });
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Edit Customer modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _editCustomerModal: BsModalRef;
  customerData: any = {};

  editCustomer(template: TemplateRef<any>) {
    this.customerData = {
      name: this.customer.name,
      phone: this.customer.phone,
      status: this.customer.status,
      physicalAddress: {
        line1: this.customer.physicalAddress && this.customer.physicalAddress.line1,
        line2: this.customer.physicalAddress && this.customer.physicalAddress.line2,
        city: this.customer.physicalAddress && this.customer.physicalAddress.city,
        state: this.customer.physicalAddress && this.customer.physicalAddress.state,
        zip: this.customer.physicalAddress && this.customer.physicalAddress.zip,
        country: this.customer.physicalAddress && this.customer.physicalAddress.country
      },
      billingAddress: {
        line1: this.customer.billingAddress && this.customer.billingAddress.line1,
        line2: this.customer.billingAddress && this.customer.billingAddress.line2,
        city: this.customer.billingAddress && this.customer.billingAddress.city,
        state: this.customer.billingAddress && this.customer.billingAddress.state,
        zip: this.customer.billingAddress && this.customer.billingAddress.zip,
        country: this.customer.billingAddress && this.customer.billingAddress.country
      }
    };

    this._editCustomerModal = this.modalService.show(template, { class: "modal-450" });
  }

  doUpdate(): void {
    this.restService.updateCustomer(this.customer.id, this.customerData)
      .subscribe(
        data => {
          this._editCustomerModal.hide();

          this.customer = data;
        }
      );
  }
  closeEditCustomerModal(): void {
    this._editCustomerModal.hide();
  }

}
