import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { RestService, FilterParams, DataTableService, ReportingProfile, Company, GlobalFunctionsService } from '@app/core/services'

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class AdminInvoicesComponent implements OnInit, OnDestroy {

  orderColumnsInvoices = ["date", "amount", null];
  valueColumnsInvoices = [
    {
      data: null,
      render: function (data, type, full, meta) {
        // Looks like no need in time part: 'yyyy-MM-dd, HH:mm:ss'
        return this.datepipe.transform(full.date, 'yyyy-MM-dd');
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.paid ? 'Yes' : 'No';
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.currencyPipe.transform(full.amount / 100);
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.discountAmount ? this.currencyPipe.transform(full.discountAmount / 100) : '';
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.chargeFailedAttempts;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var uriEncoded = this.gfService.encodeParam(`/api/web/admin/invoices/${full.id}`);
        var result = `<a onclick='truckspy.downloadInvoice("${uriEncoded}")'><i class="fa fa-file-pdf-o"></i>pdf</a>`;
        if (!full.paid) {
          result += `<a style="margin-left:10px">markAsPaid</a>`
          if (full.company.stripeCustomerId) {
            result += `<a style="margin-left:10px">charge</a>`
          }
        }
        return result;
      }.bind(this)
    }
  ];
  optionsInvoices = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsInvoices);
      this.restService.getAllInvoicesFor(this.companyId, params)
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
    columns: this.valueColumnsInvoices
  };

  downloadInvoice(invoiceURIEncoded: string) {
    this.ngZone.run(() => {
      var invoiceURI = this.gfService.decodeParam(invoiceURIEncoded);
      this.downloadInvoicePrivate(invoiceURI);
    });
  }
  downloadInvoicePrivate(invoiceURI) {
    this.restService.doReportDownload(invoiceURI, "invoice");
  }

  companyId: string;
  company: Company = new Company();
  subscriptionProfiles: ReportingProfile[];

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private dataTableService: DataTableService,
    private datepipe: DatePipe,
    private currencyPipe: CurrencyPipe) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.downloadInvoice = this.downloadInvoice.bind(this);

    this.companyId = this.route.snapshot.paramMap.get("id");
    this.restService.getCompanyBy(this.companyId)
      .subscribe(
        data => {
          this.company = data;
          this.subscriptionProfiles = data.getProfilesWithActiveSubscription();
        }
      );
  }

  ngOnDestroy() {
    window.truckspy.downloadInvoice = null;
  }

}
