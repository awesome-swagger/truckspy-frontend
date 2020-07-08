import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Map, LngLatBounds } from 'mapbox-gl';
import { Observable, Subject, merge } from 'rxjs';
import { distinctUntilChanged, debounceTime, switchMap, tap, map, filter } from 'rxjs/operators'
import { Actions } from "@ngrx/effects";
import { LngLat, MapLayerMouseEvent } from 'mapbox-gl';
import { GeoJsonProperties } from 'geojson';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import { RestService, Vehicle, DomicileLocation, MapboxHelperService, PositionsData, Position, PointFeature, MapboxPlace } from '@app/core/services';
import { MinifyMenu } from '@app/core/store/layout';
import { mapConfig } from '@app/core/smartadmin.config';
import { DateService, TimezoneHandlerPipe } from '@app/shared/pipes/timezone-handler.pipe';
import { ExitEditMode } from '@app/core/store/shortcuts';
import { IgnoreErrorModalComponent } from '../ignore-error/ignore-error-modal.component';
import * as moment from 'moment';
import { DatePipe } from "@angular/common";

const IGNORE: string = "Ignore Position(s)";
const IGNORE_ODOMETER: string = "Ignore Odometer";
const REASSIGN: string = "Reassign";

@Component({
  selector: 'app-dataview',
  templateUrl: './dataview.component.html',
  styleUrls: ['./dataview.component.css']
})
export class DataViewComponent implements OnInit {

  vehicle: Vehicle;
  profileId: string;
  locations: DomicileLocation[];

  /**
   * Bounds definition for the map to fit.
   */
  fitBounds: number[][] = this.mbHelper.calculatePositionsBounds(null);
  fitBoundsOptions = {
    padding: { top: 25, bottom: 25, left: 25, right: 25 }
  }

  /**
   * Workaround for the map auto-resize issue.
   */
  theMapInstance: Map;
  onLoad(mapInstance: Map) {
    this.theMapInstance = mapInstance;
  }
  onMinifyMenu = this.actions$.subscribe(action => {
    if (action instanceof MinifyMenu) {
      this.theMapInstance.resize();
    }
  });

  /**
   * Map styling logic.
   */
  style: string = mapConfig.STREETS;
  isDefault: boolean = true;
  toggleStyle() {
    this.style = this.isDefault ? mapConfig.SATELLITE : mapConfig.STREETS;
    this.isDefault = !this.isDefault;
  }

  /**
   * Show/hide lines logic.
   */
  isShowLine: boolean = true;
  showHideLines() {
    this.isShowLine = !this.isShowLine;
  }

  /**
   * Show/hide locations logic.
   */
  isShow: boolean = false;
  @ViewChild("thePopup") thePopup: any;
  showHideLocations() {
    this.isShow = !this.isShow;
    this.loadLocations();
    if (!this.isShow) {
      this.locations = null;
      if (this.thePopup && this.thePopup.popupInstance) {
        this.thePopup.popupInstance.remove();
      }
    }
  }

  selectedElement: GeoJsonProperties;
  selectedLngLat: LngLat;
  cursorStyle: string;

  onClick(evt: MapLayerMouseEvent) {
    this.selectedLngLat = evt.lngLat;
    this.selectedElement = JSON.parse(evt.features![0].properties.asString);
  }

  /**
   * Position finder logic.
   */
  perPageOptions = ["100", "250", "500", "1000"];
  perPage = "500";
  perPageFixed: string = this.perPage;

  findData = {
    vehicle: null,
    before: this.dateService.getCurrentTime(),
    hopToErrors: false
  }
  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;
  positions: PositionsData;
  pointFeatures: PointFeature[] = [];
  lineFeatures = {
    dotted: [],
    solid: []
  };
  positionsLoaded: boolean = false;

  page: number = 1;
  changePage(newPage) {
    this.doSearch(this.vehicle, newPage);
  }

  doSearchPositions() {
    this.positionsLoaded = false;
    this.page = 1;
    this.perPageFixed = this.perPage;
    this.doSearch(this.findData.vehicle, this.page);
  }

  doSearch(vehicle: Vehicle, page: number) {
    let before = this.dateService.transform4Backend(this.findData.before);
    this.restService.getPositionsFor(vehicle.id, this.findData.hopToErrors, before, page, this.perPageFixed)
      .subscribe(
        data => {
          this.edit = false;
          this.positions = data;
          this.positionsLoaded = true;
          this.fitBounds = this.mbHelper.calculatePositionsBounds(this.positions.mapPositions);
          this.lineFeatures = this.positions.prepareLineFeatures();
          this.pointFeatures = this.positions.preparePointFeatures();

          this.vehicle = vehicle;
        }
      );
  }

  seeErrors() {
    this.findData.vehicle = this.vehicle;
    this.findData.hopToErrors = true;
    this.doSearchPositions();
  }

  /**
   * Mouse enter/leave logic.
   */
  @ViewChild("scrollableDiv") scrollableDiv: ElementRef;

  iconEntered(iconFeature) {
    iconFeature.hover = true;
    let point: any = this.positions.tablePositions.find(function (p) {
      return iconFeature.positionId === p.id;
    });
    point.hover = true;

    // scroll to that element
    let index = this.positions.tablePositions.indexOf(point);
    this.scrollableDiv.nativeElement.scrollTop = index * 16.8 + (34 /* div header */ + 16.8 /* table header */)
      - this.scrollableDiv.nativeElement.clientHeight / 2 /* middle of the div */;
  }
  iconLeaved(iconFeature: PointFeature) {
    iconFeature.hover = false;
    let point: any = this.positions.tablePositions.find(function (p) {
      return iconFeature.positionId === p.id;
    });
    point.hover = false;
  }

  rowEntered(p) {
    p.hover = true;
    let feature = this.pointFeatures.find(function (f: PointFeature) {
      return f.positionId === p.id;
    });
    feature.hover = true;
  }
  rowLeaved(p) {
    p.hover = false;
    let feature = this.pointFeatures.find(function (f: PointFeature) {
      return f.positionId === p.id;
    });
    feature.hover = false;
  }

  /**
   * Add Position modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addPositionModal: BsModalRef;

  addPosition(position: Position) {
    let modalState = {
      profileId: this.profileId,
      forPosition: position,
      callbackFunction: this.createPositions.bind(this)
    }
    this._addPositionModal = this.modalService.show(AddPositionModalComponent, { class: "modal-lg", initialState: modalState });
  }

  createPositions(positionsData: any[]): void {
    let dateService = this.dateService;
    let vehicleid = this.vehicle.id
    let body = {
      "createPositionRequests": positionsData.map((nextData: any, index: number) => {
        let isLocation = nextData.lastSelected.isLocation;
        let requestEntry = {
          vehicleId: vehicleid,
          datetime: dateService.transform4Backend(nextData.datetime),
        }
        if (isLocation) {
          requestEntry["locationId"] = nextData.lastSelected.entry.id;
        } else {
          let placeCenter = nextData.lastSelected.entry.center;
          requestEntry["lon"] = placeCenter[0];
          requestEntry["lat"] = placeCenter[1];
        }
        return requestEntry;
      })
    };

    this.restService.createManyPositions(body)
      .subscribe(
        success => {
          this._addPositionModal.hide();
          this.doSearch(this.vehicle, this.page);
        }
      );
  }

  /**
   * Positions edit logic.
   */
  edit = false;
  all: boolean = false;
  selectedOne: boolean = false;
  selectedTwo: boolean = false;
  action: string = "";

  beginEdit() {
    this.all = false;
    this.selectedOne = false;
    this.selectedTwo = false;
    this.action = "";
    this.positions.tablePositions.forEach(function (p: any) {
      p.checked = false;
    });
    this.edit = true;
  }
  cancelEdit() {
    this.edit = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEdit();
    }
  });

  checkSelectedOneTwo() {
    let count = 0;
    this.positions.tablePositions.map((p: any) => {
      if (p.checked) {
        count++;
      }
    });
    this.selectedOne = count >= 1;
    this.selectedTwo = count >= 2;
  }
  selectSingle(newValue, p) {
    p.checked = newValue;
    let notChecked = this.positions.tablePositions.find(function (p: any) {
      return !p.checked;
    });
    this.all = !notChecked;
    this.checkSelectedOneTwo();
  }
  selectAll(newValue) {
    this.positions.tablePositions.forEach(function (p: any) {
      p.checked = newValue;
    }.bind(this));
    this.all = newValue;
    this.checkSelectedOneTwo();
  }

  getCheckedPositions(): string[] {
    let result = [];
    this.positions.tablePositions.forEach(function (p: any) {
      if (p.checked) {
        result.push(p.id);
      }
    });
    return result;
  }

  /**
   * Position Edit Confirmation modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("reassignModal") _reassignModal: ModalDirective;
  reassign: any = {};

  performReassign() {
    this.reassign = {
      positionIds: this.getCheckedPositions()
    };
    this.restService.getVehiclesToAssignFor(this.vehicle.id, this.reassign.positionIds)
      .subscribe(
        success => {
          this.reassign.vehicles = success;
          this.reassign.toVehicle = (this.reassign.vehicles && this.reassign.vehicles.length >= 1 && this.reassign.vehicles[0]) || null;
          this._reassignModal.show();
        }
      );
  }

  closeReassignModal() {
    this._reassignModal.hide();
  }
  doReassign() {
    let data = {
      action: REASSIGN,
      assignToVehicleId: this.reassign.toVehicle.id
    }
    this.actionInProgress = true;
    this.restService.updatePositionsFor(this.vehicle.id, this.reassign.positionIds, data)
      .subscribe(
        success => {
          this.restService.getVehicle(this.vehicle.id)
            .subscribe(result => {
              this.vehicle = result;

              this.actionInProgress = false;
              this._reassignModal.hide();
              this.doSearch(this.vehicle, this.page);
            });
        },
        error => {
          this.actionInProgress = false;
        }
      );
  }

  /**
   * Position Edit Confirmation modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("regularEditModal") _regularEditModal: ModalDirective;
  regularEdit: any = {};

  performIgnore() {
    this.performRegularEdit(IGNORE);
  }
  performIgnoreOdometer() {
    this.performRegularEdit(IGNORE_ODOMETER);
  }

  performRegularEdit(action) {
    let firstChecked = this.positions.tablePositions.find(function (p: any) {
      return p.checked && !!p.datetime;
    });
    let positionIds = this.getCheckedPositions();

    this.regularEdit = {
      from: firstChecked.datetime,
      action: action,
      positionIds: positionIds
    }
    this._regularEditModal.show();
  }

  actionInProgress: boolean = false;
  closeRegularEditModal() {
    this._regularEditModal.hide();
  }
  doRegularEdit() {
    let data = {
      action: this.regularEdit.action
    }
    this.actionInProgress = true;
    this.restService.updatePositionsFor(this.vehicle.id, this.regularEdit.positionIds, data)
      .subscribe(
        success => {
          this.restService.getVehicle(this.vehicle.id)
            .subscribe(result => {
              this.vehicle = result;

              this.actionInProgress = false;
              this._regularEditModal.hide();
              this.doSearch(this.vehicle, this.page);
            });
        },
        error => {
          this.actionInProgress = false;
        }
      );
  }

  /**
   * Ignore Error callback
   */
  afterIgnoreError(vehicle: Vehicle, ignoreError: IgnoreErrorModalComponent) {
    this.vehicle = vehicle;
    ignoreError.closeIngoreErrorModal();
    if (this.positionsLoaded) {
      this.findData.vehicle = vehicle;
      this.doSearchPositions();
    }
  }

  /**
   * Constructor to instantiate an instance of DataViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private actions$: Actions,
    private restService: RestService,
    private modalService: BsModalService,
    private mbHelper: MapboxHelperService,
    private dateService: DateService) { }

  ngOnInit() {
    let vehicleId = this.route.snapshot.paramMap.get("id");
    let hopToErrors = !!this.route.snapshot.queryParamMap.get('hopToErrors');
    this.findData.hopToErrors = hopToErrors;

    this.restService.getVehicle(vehicleId)
      .subscribe(result => {
        this.vehicle = result;

        this.findData.vehicle = this.vehicle;
        this.profileId = (this.vehicle && this.vehicle.reportingProfile && this.vehicle.reportingProfile.id) || null;
        this.loadLocations();

        this.restService.get1000Vehicles()
          .subscribe(result => {
            this.vehicles = result;
            this.vehiclesLoaded = true;

            if (hopToErrors) {
              this.doSearchPositions();
            }
          });

      });

  }

  loadLocations() {
    if (this.isShow) {
      this.restService.getValidLocationsFor(this.profileId, null)
        .subscribe(result => {
          this.locations = result;
          // this.fitBounds = this.mbHelper.calculateBounds(this.locations);
        });
    }
  }

}

@Component({
  selector: 'add-position-modal',
  templateUrl: './add-position-modal.component.html'
})
export class AddPositionModalComponent implements OnInit {

  /** Initial state */
  profileId: string;
  forPosition: Position;
  callbackFunction;

  /**
   * ISO8601 formatted datetime
   */
  beginDate: string;
  positionsData: any[];

  allSelected: boolean = false;
  searching: boolean; // not curently utilized

  searchPlaces = (input: NgbTypeahead, order: number) => {
    let click$ = this.positionsData[order].click$;
    let focus$ = this.positionsData[order].focus$;

    return (text$: Observable<string>) => {
      const debouncedText$ = text$.pipe(debounceTime(300), distinctUntilChanged());
      const clicksWithClosedPopup$ = click$.pipe(filter(() => !input.isPopupOpen()));
      const inputFocus$ = focus$;

      return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
        tap(() => this.searching = true),
        switchMap(term =>
          this.restService.doMixedProfileSearch(this.profileId, term).pipe(
            map(list => list.slice(0, 15))
          )
        ),
        tap(() => this.searching = false)
      );
    }
  }

  focusOut(index) {
    let positionData = this.positionsData[index];
    let lastSelected = positionData.lastSelected;
    let isLocation = lastSelected && lastSelected.isLocation;
    if (!!lastSelected) {
      positionData.theName = isLocation ? lastSelected.entry.name : lastSelected.entry.place_name;
    }

    this.calculateConditions();
  }

  clickSelected(item, index) {
    item.preventDefault();
    let positionData = this.positionsData[index];
    positionData.lastSelected = item.item;

    let isLocation = item.item.isLocation;
    let entry: any = item.item.entry;
    positionData.theName = isLocation ? entry.name : entry.place_name;

    this.calculateConditions();
  }

  createPositions(): void {
    this.callbackFunction(this.positionsData);
  }
  closeModal(): void {
    this.bsModalRef.hide();
  }

  constructor(
    private bsModalRef: BsModalRef,
    private restService: RestService,
    private tzHandler: TimezoneHandlerPipe) { }

  ngOnInit() {
    this.positionsData = [];

    this.beginDate = this.forPosition.datetime;
    this.addPosition();
  }

  calculateConditions() {
    let notSelected = this.positionsData.find(function (positionData) {
      return !positionData.lastSelected;
    });
    this.allSelected = !notSelected;
  }

  private calculateDateForNextPosition(): Date {
    if (this.positionsData.length === 0) {
      return this.tzHandler.transform(this.beginDate)
    }
    const previousDate = this.positionsData[this.positionsData.length -1].datetime;
    return moment(previousDate).add(3, 'hours').toDate();
  }

  /**
   * Unique ID holder to utilize within view for name/id fields (avoiding view mixed up for input values).
   */
  UNIQUE_ID: number = 1;
  addPosition() {
    let positionData = {
      id: this.UNIQUE_ID++,
      datetime: this.calculateDateForNextPosition(),
      lastSelected: null,
      /** Helper variable to hold last selected element */
      theName: null,
      /** ngbTypeahead specific values */
      focus$: new Subject<string>(),
      click$: new Subject<string>()
    };

    this.positionsData.push(positionData);
    this.allSelected = false; // no need in #calculateConditions()
  }
  deletePosition(index: number) {
    this.positionsData.splice(index, 1);
    this.calculateConditions();
  }

}
