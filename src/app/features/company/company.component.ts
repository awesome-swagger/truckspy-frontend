import { Component, OnInit } from '@angular/core';
import { StripeScriptTag } from "stripe-angular"
import { environment } from '@env/environment';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {

  private publishableKey: string = environment.stripePublishableKey;

  constructor(public StripeScriptTag: StripeScriptTag) {
    this.StripeScriptTag.setPublishableKey(this.publishableKey);
  }

  ngOnInit() { }

}
