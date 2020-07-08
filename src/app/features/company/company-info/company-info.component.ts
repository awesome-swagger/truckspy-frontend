import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Store, select } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { take } from 'rxjs/operators';
import { StripeSource, StripeToken, StripeCard } from 'stripe-angular';

import { RestService, Company, Source, NotificationService, ReportingProfile } from '@app/core/services'
import { getConfigStatesKeyValues, ConfigState } from '@app/core/store/config';
import { ExitEditMode } from '@app/core/store/shortcuts';

@Component({
  selector: 'app-company-info',
  templateUrl: './company-info.component.html',
  styleUrls: ['./company-info.component.css']
})
export class CompanyInfoComponent implements OnInit {

  company: Company;
  source: Source;
  editCompany: boolean = false;
  companyData = {};
  states: any[];

  beginEditCompany() {
    this.companyData = {
      name: this.company.name,
      address1: this.company.address1,
      address2: this.company.address2,
      city: this.company.city,
      state: this.company.state,
      zip: this.company.zip
    };
    this.editCompany = true;
  }
  cancelEditCompany() {
    this.editCompany = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEditCompany();
      this.cancelCreateCard();
    }
  });

  saveCompany() {
    this.restService.updateCompany(this.company.id, this.companyData)
      .subscribe(
        data => {
          this.company = data;
          this.editCompany = false;
        }
      );
  }

  /**
   * Defines if Billing Information is in Edit/Add mode.
   */
  createCard: boolean = false;
  extraData = {};
  cardOptions = {
    hidePostalCode: true
  }

  @ViewChild("stripeCard") stripeCard: StripeCard;

  beginCreateCard() {
    this.extraData = {
      name: (this.source && this.source.name) || "",
      address_line1: (this.source && this.source.address_line1) || "",
      address_line2: (this.source && this.source.address_line2) || "",
      address_city: (this.source && this.source.address_city) || "",
      address_state: (this.source && this.source.address_state) || "",
      address_zip: (this.source && this.source.address_zip) || ""
    };
    this.createCard = true;
  }
  cancelCreateCard() {
    this.createCard = false;
  }
  async doCreateCard() {
    const token: StripeToken = await this.stripeCard.createToken(this.extraData);

    if (token && token.id) {
      this.restService.addSource(token.id)
        .subscribe(
          data => {
            this.company = data;
            this.source = this.company.getDefaultSource();
            this.createCard = false;
          }
        );
    } else {
      console.log("Something wrong happened here...");
    }
  }

  onStripeError(error: Error) {
    let errorHTML = `<b>Stripe</b>: ${error.message}`;
    this.notificationService.smallBox({
      content: `<i class='fa fa-exclamation-triangle'></i>&nbsp;${errorHTML}`,
      color: "#a90329",
      timeout: 4000
    });

    console.error('Stripe error', error);
  }

  /**
   * Set Default Reporting Profile modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _setDefaultModal: BsModalRef;
  setDefaultData = {
    reportingProfileId: null
  };
  reportingProfiles: ReportingProfile[];

  setDefault(template: TemplateRef<any>) {
    this.setDefaultData = {
      reportingProfileId: (this.reportingProfiles && this.reportingProfiles.length >= 1 && this.reportingProfiles[0].id) || "",
    };
    this._setDefaultModal = this.modalService.show(template, { class: "" });
  }

  doSetDefault(): void {
    this.restService.setDefaultReportingProfile(this.setDefaultData.reportingProfileId)
      .subscribe(
        data => {
          this._setDefaultModal.hide();
          this.company = data;
        }
      );
  }
  closeSetDefaultModal(): void {
    this._setDefaultModal.hide();
  }

  /**
   * Constructor to instantiate an instance of CompanyInfoComponent.
   */
  constructor(
    private actions$: Actions,
    private restService: RestService,
    private notificationService: NotificationService,
    private modalService: BsModalService,
    private store: Store<ConfigState>) { }

  ngOnInit() {
    this.company = new Company();

    this.store.pipe(select(getConfigStatesKeyValues), take(1)).subscribe(val => {
      this.states = val;
    });

    this.restService.getCompany()
      .subscribe(
        data => {
          this.company = data;
          this.source = this.company.getDefaultSource();
        }
      );
    this.restService.get1000ReportingProfiles()
      .subscribe(result => {
        this.reportingProfiles = result;
      });
  }

}
