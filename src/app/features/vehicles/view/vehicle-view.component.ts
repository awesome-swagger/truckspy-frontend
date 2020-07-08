import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { distinctUntilChanged, debounceTime, switchMap, tap, catchError } from 'rxjs/operators'
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { Subject, Observable, of, concat, combineLatest } from 'rxjs';

import {
  RestService, Vehicle, ReportingProfileHistory, ReportingProfile, DomicileLocation, DispatchGroup,
  VehicleType, Attribute, EntityType, LocalStorageService, Company, InspectionConfig
} from '@app/core/services'
import { LoggedInAs, AuthState, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';
import { IgnoreErrorModalComponent } from '../ignore-error/ignore-error-modal.component';

@Component({
  selector: 'app-vehicle-view',
  templateUrl: './vehicle-view.component.html',
  styleUrls: ['./vehicle-view.component.css']
})
export class VehicleViewComponent implements OnInit {

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loginAsCompany = this.lsService.getCompany();
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loginAsCompany = null;
    }
  });


  @ViewChild("appReportsTable") appReportsTable: any;
  refreshReports() {
    this.appReportsTable.reloadReports();
  }

  vehicleId: string;
  entityType: string = EntityType.VEHICLE;
  vehicle: Vehicle = new Vehicle();
  loaded: boolean = false;
  profileId: string;
  locationAssignable: boolean = false;
  configurationAssignable: boolean = false;
  dispatchGroupAssignable: boolean = false;
  typeAssignable: boolean = false;

  period(history: ReportingProfileHistory): string {
    let start = this.dateService.transformDateTime(history.startedAt);
    let end = (history.endedAt && this.dateService.transformDateTime(history.endedAt)) || "Present";
    return `${start} - ${end}`;
  }

  /**
   * Ignore Error callback
   */
  afterIgnoreError(vehicle: Vehicle, ignoreError: IgnoreErrorModalComponent) {
    this.vehicle = vehicle;
    ignoreError.closeIngoreErrorModal();
    this.appReportsTable.reloadReports();
  }

  /**
   * Reassign Vehicle modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _reassignModal: BsModalRef;
  reassignData = {
    reportingProfileId: null,
    asOf: new Date()
  };
  reportingProfiles: ReportingProfile[];

  reassign(template: TemplateRef<any>) {
    this.reassignData = {
      reportingProfileId: (this.reportingProfiles && this.reportingProfiles.length >= 1 && this.reportingProfiles[0].id) || "",
      asOf: new Date()
    };
    this._reassignModal = this.modalService.show(template, { class: "" });
  }

  doReassign(): void {
    let data = {
      reportingProfileId: this.reassignData.reportingProfileId,
      asOf: this.dateService.transform4Backend(this.reassignData.asOf)
    }
    this.restService.assignVehicleToReportingProfile(this.vehicleId, data)
      .subscribe(
        data => {
          this._reassignModal.hide();
          this.vehicle = data;
          this.appReportsTable.reloadReports();
        }
      );
  }
  closeReassignModal(): void {
    this._reassignModal.hide();
  }

  /**
   * Assign Dispatch Group modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignDispatchGroupModal: BsModalRef;
  assignDispatchGroupData = {
    dispatchGroupId: null
  };
  dispatchGroups: DispatchGroup[];

  assignDispatchGroup(template: TemplateRef<any>) {
    this.assignDispatchGroupData = {
      dispatchGroupId: (this.dispatchGroups && this.dispatchGroups.length >= 1 && this.dispatchGroups[0].id) || "",
    };
    this._assignDispatchGroupModal = this.modalService.show(template, { class: "modal-sm" });
  }

  doAssignDispatchGroup(): void {
    this.restService.assignDispatchGroupToVehicle(this.vehicleId, this.assignDispatchGroupData.dispatchGroupId)
      .subscribe(
        data => {
          this._assignDispatchGroupModal.hide();
          this.vehicle = data;
        }
      );
  }
  closeAssignDispatchGroupModal(): void {
    this._assignDispatchGroupModal.hide();
  }

  /**
   * Unassign Dispatch Group logic.
   */
  unassignDispatchGroup(group: DispatchGroup, actionComponent: LongActionLinkComponent) {
    this.restService.unassignDispatchGroupFromVehicle(this.vehicleId, group.id)
      .subscribe(
        good => {
          this.restService.getVehicle(this.vehicleId)
            .subscribe(result => {
              this.vehicle = result;
            });
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Assign Vehicle Type modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignTypeModal: BsModalRef;
  assignTypeData = {
    typeId: null
  };
  types: VehicleType[];

  assignType(template: TemplateRef<any>) {
    this.assignTypeData = {
      typeId: (this.types && this.types.length >= 1 && this.types[0].id) || "",
    };
    this._assignTypeModal = this.modalService.show(template, { class: "modal-sm" });
  }

  doAssignType(): void {
    this.restService.assignVehicleTypeToVehicle(this.vehicleId, this.assignTypeData.typeId)
      .subscribe(
        data => {
          this._assignTypeModal.hide();
          this.vehicle = data;
          // this.appReportsTable.reloadReports();
        }
      );
  }
  closeAssignTypeModal(): void {
    this._assignTypeModal.hide();
  }

  /**
   * Unassign Vehicle Type logic.
   */
  unassignType(type: VehicleType, actionComponent: LongActionLinkComponent) {
    this.restService.unassignVehicleTypeFromVehicle(this.vehicleId, type.id)
      .subscribe(
        good => {
          this.restService.getVehicle(this.vehicleId)
            .subscribe(result => {
              this.vehicle = result;
            });
          // this.loadReportingProfile();
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Toggle Vehicle's Status modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _toggleStatusModal: BsModalRef;

  toggleStatus(template: TemplateRef<any>) {
    this._toggleStatusModal = this.modalService.show(template, { class: "modal-sm" });
  }
  doToggleStatus(): void {
    this.restService.toggleVehicleStatus(this.vehicleId)
      .subscribe(
        data => {
          this._toggleStatusModal.hide();
          this.vehicle = data;
          this.appReportsTable.reloadReports();
        }
      );
  }
  closeToggleStatusModal(): void {
    this._toggleStatusModal.hide();
  }

  /**
   * Assign Inspection Configuration modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignConfigurationModal: BsModalRef;
  configurations: InspectionConfig[] = [];
  validConfigurations: Observable<InspectionConfig[]>;
  configuration = null;
  configurationsLoading = false;
  configurationsTypeahead$ = new Subject<string>();

  loadConfigurations() {
    this.validConfigurations = concat(
      of(this.configurations), // default items
      this.configurationsTypeahead$.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => this.configurationsLoading = true),
        switchMap(term =>
          of(this.configurations.filter(config => config.nameMatches(term)))
        ),
        tap(() => this.configurationsLoading = false),
      )
    );
  }

  assignConfiguration(template: TemplateRef<any>) {
    this.configuration = null;
    this._assignConfigurationModal = this.modalService.show(template, { class: "modal-400" });
  }
  doAssignConfiguration(): void {
    this.restService.assignInspectionConfigToVehicle(this.vehicleId, this.configuration.id)
      .subscribe(
        data => {
          this._assignConfigurationModal.hide();
          this.vehicle = data;
        }
      );
  }
  closeAssignConfigurationModal(): void {
    this._assignConfigurationModal.hide();
  }

  /**
   * Unassign Inspection Configuration logic.
   */
  unassignConfiguration(configuration: InspectionConfig, actionComponent: LongActionLinkComponent) {
    this.restService.unassignInspectionConfigFromVehicle(this.vehicleId, configuration.id)
      .subscribe(
        good => {
          this.restService.getVehicle(this.vehicleId)
            .subscribe(result => {
              this.vehicle = result;
            });
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Assign Domicile Location modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignDomicileModal: BsModalRef;
  initialLocations: DomicileLocation[] = [];
  validLocations: Observable<DomicileLocation[]>;
  location = null;
  locationsLoading = false;
  locationsTypeahead$ = new Subject<string>();

  loadLocations() {
    this.validLocations = concat(
      of(this.initialLocations), // default items
      this.locationsTypeahead$.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => this.locationsLoading = true),
        switchMap(term => this.restService.getValidLocationsFor(this.profileId, term).pipe(
          catchError(() => of([])),
          tap(() => {
            this.locationsLoading = false
          })
        ))
      )
    );
  }

  assignDomicile(template: TemplateRef<any>) {
    this.location = null;
    this._assignDomicileModal = this.modalService.show(template, { class: "modal-sm" });
  }
  doAssignDomicile(): void {
    this.restService.assignDomicile(this.vehicleId, this.location.id)
      .subscribe(
        data => {
          this._assignDomicileModal.hide();
          this.vehicle = data;
        }
      );
  }
  closeAssignDomicileModal(): void {
    this._assignDomicileModal.hide();
  }

  /**
   * Edit Vehicle modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _editVehicleModal: BsModalRef;
  vehicleData = {
    remoteId: "",
    gpsDataQualityEnforcement: 0,
    autoFix: false,
    year: 0,
    make: "",
    model: "",
    vin: "",
    attributes: []
  };
  gpsEnforcementValues: any[] = [];

  editVehicle(template: TemplateRef<any>) {
    let company = this.theCompany();
    let frontlineEnabled = company && company.enabledFeatures && company.enabledFeatures.frontline;

    this.vehicleData = {
      remoteId: this.vehicle.remoteId,
      gpsDataQualityEnforcement: this.vehicle.gpsDataQualityEnforcement,
      autoFix: this.vehicle.autoFix,
      year: this.vehicle.year,
      make: this.vehicle.make,
      model: this.vehicle.model,
      vin: this.vehicle.vin,
      attributes: frontlineEnabled ? this.vehicle.editableAttributes.map((attr: Attribute) => ({
        name: attr.name,
        value: attr.value || "",
      })) : []
    };
    this.gpsEnforcementValues = this.vehicle.gpsEnforcementValues();
    this._editVehicleModal = this.modalService.show(template, { class: "modal-450" });
  }

  private updateVehicle() {
    this.restService.updateVehicle(this.vehicle.id, this.vehicleData)
      .subscribe(
        data => {
          this._editVehicleModal.hide();

          this.vehicle = data;
          this.appReportsTable.reloadReports();
        });
  }
  doUpdate(): void {
    let company = this.theCompany();
    let frontlineEnabled = company && company.enabledFeatures && company.enabledFeatures.frontline;

    if (frontlineEnabled) {
      this.restService.updateVehicleAttributes(this.vehicle.id, this.vehicleData.attributes)
        .subscribe(
          success => {
            this.updateVehicle();
          });
    } else {
      this.updateVehicle();
    }
  }
  closeEditVehicleModal(): void {
    this._editVehicleModal.hide();
  }

  /**
   * Constructor to instantiate an instance of VehicleViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private actions$: Actions,
    private store: Store<AuthState>,
    private lsService: LocalStorageService,
    private dateService: DateService) { }

  ngOnInit() {
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();

    this.vehicleId = this.route.snapshot.paramMap.get("id");
    this.restService.getVehicle(this.vehicleId)
      .subscribe(result => {
        this.vehicle = result;
        this.profileId = (result && result.reportingProfile && result.reportingProfile.id) || null;
        this.loaded = true;
        if (this.profileId) {
          this.restService.getValidLocationsFor(this.profileId, "")
            .subscribe(
              data => {
                this.initialLocations = data;
                this.locationAssignable = this.initialLocations && this.initialLocations.length > 0;
                this.loadLocations();
              }
            );
        }
      });

    const observables: Observable<any>[] = [
      this.restService.get1000ReportingProfileLights(), // ordered by name.ASC
      this.restService.get1000DispatchGroupsLight(), // ordered by name.ASC
      this.restService.get1000VehicleTypesLight(), // ordered by name.ASC
    ];
    if (this.company.devicesEnabled) {
      observables.push(this.restService.get1000InspectionConfigsLight())  // ordered by name.ASC
    }
    combineLatest.apply(this, observables).subscribe(
      data => {
        this.reportingProfiles = data[0];

        this.dispatchGroups = data[1];
        this.dispatchGroupAssignable = this.dispatchGroups && this.dispatchGroups.length > 0;

        this.types = data[2];
        this.typeAssignable = this.types && this.types.length > 0;

        if (data[3]) {
          this.configurations = data[3];
          this.configurationAssignable = this.configurations && this.configurations.length > 0;
          this.loadConfigurations();
        }
      }
    );
  }

}
