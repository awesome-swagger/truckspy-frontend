import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';

import { RestService, FilterParams, DataTableService, ReportingProfile, Company, GlobalFunctionsService } from '@app/core/services'

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit, OnDestroy {

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
        return this.currencyPipe.transform(full.amount / 100);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var uriEncoded = this.gfService.encodeParam(`/api/web/company/invoices/${full.id}`);
        return `<a onclick='truckspy.downloadInvoice("${uriEncoded}")'><i class="fa fa-file-pdf-o"></i>pdf</a>`;
      }.bind(this)
    }
  ];
  optionsInvoices = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsInvoices);
      this.restService.getAllInvoices(params)
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

  subscriptionProfiles: ReportingProfile[];
  company: Company;

  constructor(
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

    this.company = new Company();
    this.restService.getCompany()
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
