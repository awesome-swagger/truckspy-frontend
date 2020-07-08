import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Company, RestService, Source } from '@app/core/services';

@Component({
  selector: 'app-admin-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class AdminCompanyComponent implements OnInit {

  companyId: string;
  company: Company = new Company();
  source: Source;

  /**
   * Constructor to instantiate an instance of AdminCompanyComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService) { }

  ngOnInit() {
    this.companyId = this.route.snapshot.paramMap.get("id");
    this.getCompanyInfo();
  }

  getCompanyInfo() {
    this.restService.getCompanyBy(this.companyId)
      .subscribe(result => {
        this.company = result;
        this.source = this.company.getDefaultSource();
      });
  }

  toggleDevicesEnable() {
    const observable = this.company.devicesEnabled
      ? this.restService.devicesDisable(this.company.id)
      : this.restService.devicesEnable(this.company.id);
    observable.subscribe((success) => {
      this.getCompanyInfo();
    });
  }

  toggleCreditAllow() {
    this.restService.CreditAllow(this.company.id)
      .subscribe((result) => {
        this.company = result;
        this.source = this.company.getDefaultSource();
      });
  }

}
