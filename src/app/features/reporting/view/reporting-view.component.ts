import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Store, select } from "@ngrx/store";
import { Actions } from '@ngrx/effects';
import { take } from "rxjs/operators";
import { ModalDirective, BsModalRef, BsModalService } from 'ngx-bootstrap';

import { ConfigState, getConfigReportends, getConfigTimezonesKeys, getConfigUnits } from '@app/core/store/config';
import { RestService, ReportingProfile, Subscription, ProductEstimation, LocationGroup } from '@app/core/services'
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';
import { ExitEditMode } from '@app/core/store/shortcuts';

@Component({
  selector: 'app-reporting-view',
  templateUrl: './reporting-view.component.html',
  styleUrls: ['./reporting-view.component.css']
})
export class ReportingViewComponent implements OnInit {

  @ViewChild("appReportsTable") appReportsTable: any;

  reportingId: string;
  reporting: ReportingProfile = new ReportingProfile();
  edit: boolean = false;
  reportingData = {};

  periodEnds: string[];
  timeZones: string[];
  validUnits: string[];
  products: ProductEstimation[];
  actualProducts: ProductEstimation[];
  activeSubscriptions: Subscription[];

  beginEdit() {
    this.reportingData = {
      name: this.reporting.name,
      entityName: this.reporting.entityName,
      entityIdentifier: this.reporting.entityIdentifier,
      reportPeriodEnd: this.reporting.reportPeriodEnd,
      reportTimeZone: this.reporting.reportTimeZone,
      units: this.reporting.units
    };
    this.edit = true;
  }
  cancelEdit() {
    this.edit = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEdit();
      this.cancelEditMileage();
      this.cancelEditMinimumWage();
    }
  });

  save() {
    this.restService.updateReportingProfile(this.reportingId, this.reportingData)
      .subscribe(
        data => {
          this.reporting = data;
          this.edit = false;
          this.appReportsTable.reloadReports();
        }
      );
  }

  /**
   * Defines if Mileage Compliance Settings block is in edit mode.
   */
  editMileage: boolean = false;
  mileageSubscription: Subscription;
  mileageData = {};

  beginEditMileage() {
    this.mileageData = {
      IVMRVehiclePDFLayout: this.mileageSubscription.settings && this.mileageSubscription.settings.IVMRVehiclePDFLayout,
      newPageAfterOdometerAdjustment: this.mileageSubscription.settings && this.mileageSubscription.settings.newPageAfterOdometerAdjustment,
      showOdometerAdjustments: this.mileageSubscription.settings && this.mileageSubscription.settings.showOdometerAdjustments,
      newPageForMonthEnd: this.mileageSubscription.settings && this.mileageSubscription.settings.newPageForMonthEnd,
      groupReportsByDomicile: this.mileageSubscription.settings && this.mileageSubscription.settings.groupReportsByDomicile
    };
    this.editMileage = true;
  }
  cancelEditMileage() {
    this.editMileage = false;
  }
  saveMileage() {
    let subscriptionId = this.mileageSubscription.id;
    this.restService.updateSubscriptionSettings(subscriptionId, this.mileageData)
      .subscribe(
        data => {
          this.mileageSubscription = data;
          this.editMileage = false;
        }
      );
  }

  /**
   * Defines if Minimum Wage Compliance Settings block is in edit mode.
   */
  editMinimumWage: boolean = false;
  minimumWageSubscription: Subscription;
  minimumWageData = {};

  beginEditMinimumWage() {
    this.minimumWageData = {
      minimumWage: this.minimumWageSubscription.settings && this.minimumWageSubscription.settings.minimumWage,
      overTimeHoursOver: this.minimumWageSubscription.settings && this.minimumWageSubscription.settings.overTimeHoursOver,
      overTimeRateMultiplier: this.minimumWageSubscription.settings && this.minimumWageSubscription.settings.overTimeRateMultiplier,
      timeSheetExcelLayout: this.minimumWageSubscription.settings && this.minimumWageSubscription.settings.timeSheetExcelLayout,
      timeSheetPDFLayout: this.minimumWageSubscription.settings && this.minimumWageSubscription.settings.timeSheetPDFLayout,
      profileExcelLayout: this.minimumWageSubscription.settings && this.minimumWageSubscription.settings.profileExcelLayout,
      profilePDFLayout: this.minimumWageSubscription.settings && this.minimumWageSubscription.settings.profilePDFLayout
    };
    this.editMinimumWage = true;
  }
  cancelEditMinimumWage() {
    this.editMinimumWage = false;
  }
  saveMinimumWage() {
    let subscriptionId = this.minimumWageSubscription.id;
    this.restService.updateSubscriptionSettings(subscriptionId, this.minimumWageData)
      .subscribe(
        data => {
          this.minimumWageSubscription = data;
          this.editMinimumWage = false;
        }
      );
  }

  /**
   * Remove Subscription modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("unsubscribeModal") _unsubscribeModal: ModalDirective;
  forSubscription = {
    id: "",
    productType: ""
  };

  initUnsubscribeModal(subscription: any) {
    this.forSubscription = subscription;
    this._unsubscribeModal.show();
  }
  closeUnsubscribeModal() {
    this._unsubscribeModal.hide();
  }

  unsubscribe(subscriptionId: string) {
    this.restService.deleteSubscription(this.reportingId, subscriptionId)
      .subscribe(result => {
        this._unsubscribeModal.hide();
        this.loadReportingProfile();
        // TODO: Need to check if Reports table needs to be reloaded
      });
  }

  /**
   * Add Subscription modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("subscribeModal") _subscribeModal: ModalDirective;
  forProduct = {
    type: ""
  };

  initSubscribeModal(product: any) {
    this.forProduct = product;
    this._subscribeModal.show();
  }
  closeSubscribeModal() {
    this._subscribeModal.hide();
  }

  subscribe(product: string) {
    this.restService.subscribeToProduct(this.reportingId, product)
      .subscribe(result => {
        this._subscribeModal.hide();
        this.loadReportingProfile();
      });
  }

  /**
   * Assign Location Group modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignGroupModal: BsModalRef;
  groupData = {
    group: null
  };
  groups: LocationGroup[];

  assignGroup(template: TemplateRef<any>) {
    this.groupData = {
      group: (this.groups && this.groups.length >= 1 && this.groups[0]) || null
    };
    this._assignGroupModal = this.modalService.show(template, { class: "modal-400" });
  }

  doAssignGroup(): void {
    this.restService.assignLocationGroupTo(this.reportingId, this.groupData.group && this.groupData.group.id)
      .subscribe(
        good => {
          this._assignGroupModal.hide();
          this.loadReportingProfile();
        }
      );
  }
  closeAssignGroupModal(): void {
    this._assignGroupModal.hide();
  }

  unassignGroup(group: LocationGroup, actionComponent: LongActionLinkComponent) {
    this.restService.unassignLocationGroupFrom(this.reportingId, group.id)
      .subscribe(
        good => {
          this.loadReportingProfile();
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of ReportingViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private actions$: Actions,
    private restService: RestService,
    private modalService: BsModalService,
    private store: Store<ConfigState>) { }

  ngOnInit() {
    this.store.pipe(select(getConfigReportends), take(1)).subscribe(val => {
      this.periodEnds = val;
    });
    this.store.pipe(select(getConfigTimezonesKeys), take(1)).subscribe(val => {
      this.timeZones = val;
    });
    this.store.pipe(select(getConfigUnits), take(1)).subscribe(val => {
      this.validUnits = val;
    });

    this.reportingId = this.route.snapshot.paramMap.get("id");
    this.restService.getProductsFor(this.reportingId)
      .subscribe(products => {
        this.products = products;
        this.restService.get1000LocationGroups()
          .subscribe(groups => {
            this.groups = groups;
            this.loadReportingProfile();
          });
      });
  }

  private loadReportingProfile() {
    this.restService.getReportingProfile(this.reportingId)
      .subscribe(result => {
        this.reporting = result
        this.minimumWageSubscription = result.getMinimumWageSubscription();
        this.mileageSubscription = result.getMileageSubscription();
        this.activeSubscriptions = result.activeSubscriptions();

        // Filter out products - left only available for subscription ones:
        let subscribed = result.activeSubscriptionTypes();
        this.actualProducts = this.products.filter(
          product => !subscribed.includes(product.type));

        let mwSettings = this.minimumWageSubscription && this.minimumWageSubscription.settings;
        if (mwSettings) {
          this.validTimeSheetExcelLayouts = this.getDictionaryValues(mwSettings.validTimeSheetExcelLayouts);
          this.validTimeSheetPDFLayouts = this.getDictionaryValues(mwSettings.validTimeSheetPDFLayouts);
          this.validProfileExcelLayouts = this.getDictionaryValues(mwSettings.validProfileExcelLayouts);
          this.validProfilePDFLayouts = this.getDictionaryValues(mwSettings.validProfilePDFLayouts);
        }

        let mileageSettings = this.mileageSubscription && this.mileageSubscription.settings;
        if (mileageSettings) {
          this.validIVMRVehiclePDFLayouts = this.getDictionaryValues(mileageSettings.validIVMRVehiclePDFLayouts);
        }
      });
  }

  validTimeSheetExcelLayouts: string[] = [];
  validTimeSheetPDFLayouts: string[] = [];
  validProfileExcelLayouts: string[] = [];
  validProfilePDFLayouts: string[] = [];
  validIVMRVehiclePDFLayouts: string[] = [];
  private getDictionaryValues(dictionary: any): string[] {
    let result: string[] = [];
    if (dictionary) {
      Object.keys(dictionary).forEach(key => {
        let value = dictionary[key];
        result.push(value);
      });
    }
    return result;
  }

}
