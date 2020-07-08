import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { combineLatest, Subscription, interval } from 'rxjs';

import {
  RestService, Vehicle, Driver, TripsHandler, TripStatus, BookingStatus, Booking, TripsHandlerItem,
  ResourceType, Customer, VehicleType, FeedbackType, DomicileLocation, Trip, StopLoadType, Stop,
  TripResourcesHandler, Status, Connection, DispatchGroup
} from '@app/core/services/rest.service';
import { StorageService } from '@app/core/services/storage.service';
import { ModalDirective, BsModalRef } from 'ngx-bootstrap';
import { AddressUtil } from '@app/features/shared/address-input.component';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

const DISPATCH_GROUP_ID = 'dispatch_group_id';
const HIDE_BOOKINGS = 'hide_bookings';
const FIVE_MINUTE_MILLIS: number = 5 * 60 * 1000;

/**
 * Logic/behavior in terms of refreshing tables:
 * 1) Delete Trip (+Booking AND +Trip)
 *    ===> Refresh Bookings (left collapse/page unchanged) AND Refresh Trips (left collapse/page unchanged)
 * 2) Create Trip (-Booking AND +Trip)
 *    ===> Refresh Bookings (left collapse/page unchanged) AND Refresh Trips (left collapse/page unchanged)
 * 3) Switch V-tab Trips
 *    ===> Refresh Trips (reset collapse/page)
 * 4) Switch H-tab Trips
 *    ===> Refresh Trips (reset collapse/page)
 * 
 * 5) Create Booking (+Booking.Available)
 *    ===> Refresh Bookings (left collapse/page unchanged)
 * 6) Switch V-tab Booking
 *    ===> Refresh Bookings (reset collapse/page)
 */
@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.scss']
})
export class DispatchComponent implements OnInit, OnDestroy {

  availableBookings: Booking[] = [];

  /**
   * Add Trip modal reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("addTripModal") _addTripModal: ModalDirective;
  loadedTypes = [StopLoadType.EMPTY, StopLoadType.LOADED];
  resourceTypes = [ResourceType.VEHICLE, ResourceType.DRIVER];
  tripData: {
    booking: Booking;
    bookingId: string;
    bookingStops: Stop[];
    stopsBegin: any,
    stops: any[];
    resources: any[],
    fixedResourcesCount: number;
    vehicleType: VehicleType;
  };
  applicableVehicles: Vehicle[] = [];

  /**
   * Workaround for the SmartAdmin select2 wrapper.
   */
  resourceChanged(resource, value) {
    resource.entityId = value;
  }

  onTypeChange(resource, value): void {
    let collection = (value === ResourceType.VEHICLE) ? this.applicableVehicles : this.activeDrivers;
    resource.entityId = !!collection && collection.length > 0 && collection[0].id || "";
    resource.entity = !!collection && collection.length > 0 && collection[0] || null;
  }

  onBookingDrop(item: TripsHandlerItem, event: any) {
    let booking: Booking = event.dragData;
    let vehicleType = booking.vehicleType;
    this.applicableVehicles = (!!vehicleType && !!vehicleType.id)
      ? this.vehicles.filter(vehicle => !!vehicle.type && vehicle.type.id === vehicleType.id)
      : this.vehicles;

    let resources: any[] = new TripResourcesHandler(item).getInitResource(this.applicableVehicles, this.activeDrivers);
    this.UNIQUE_RESOURCE_ID = 1;
    this.tripData = {
      booking: booking,
      bookingId: booking.id,
      bookingStops: booking.stops,
      stopsBegin: Math.max(...booking.stops.map(stop => (stop.stopOrder))),
      stops: [],
      resources: resources.map((next: any) => ({
        ...next,
        id: this.UNIQUE_RESOURCE_ID++,
      })),
      fixedResourcesCount: resources.length,
      vehicleType: vehicleType
    }
    this.UNIQUE_ID = 1;
    this._addTripModal.show();
  }

  doCreateTrip() {
    let dateService = this.dateService;
    let body = {
      "bookingIds": [
        this.tripData.bookingId
      ],
      "dispatchOrder": 1,
      "resources": this.tripData.resources.map((resource: any, index: number) => (
        {
          "entityType": resource.entityType,
          "entityId": resource.entityId,
        }
      )),
      "stops": this.tripData.stops.map((stop: any, index: number) => (
        {
          "stopOrder": this.tripData.stopsBegin + index + 1,
          "arriveDate": dateService.transform4Backend(stop.arriveDate),
          "loadedType": stop.loadedType,
          "requiredFeedbackTypes": stop.requiredFeedbackTypes.map((feedbackId: string) => (
            {
              "id": feedbackId
            }
          )),
          "location": stop.isLocation ? { "id": stop.locationId } : null,
          "address": stop.isLocation ? null : {
            "line1": stop.address.line1,
            "line2": stop.address.line2,
            "city": stop.address.city,
            "state": stop.address.state,
            "country": stop.address.country,
            "zip": stop.address.zip
          }
        }
      ))
    };

    // console.log(body);
    this.restService.createTrip(body)
      .subscribe(
        data => {
          this._addTripModal.hide();
          this.reloadBookings(false);
          this.reloadTrips(false);
        }
      );
  }

  /**
   * Unique ID holder to utilize within view for name/id fields (avoiding view mixed up for input values).
   */
  UNIQUE_ID: number;
  addStop() {
    let stops = this.tripData.stops;
    let nextStop = {
      id: this.UNIQUE_ID++,
      arriveDate: this.dateService.getCurrentTime(),
      loadedType: this.loadedTypes[0],
      address: this.addressUtil.defaultAddress(),
      isLocation: false,
      locationId: !!this.locations && this.locations.length > 0 && this.locations[0].id,
      requiredFeedbackTypes: []
    }
    stops.push(nextStop);
  }
  deleteStop(index: number) {
    this.tripData.stops.splice(index, 1);
  }

  UNIQUE_RESOURCE_ID: number;
  addResource() {
    let resources = this.tripData.resources;
    let nextResource = {
      id: this.UNIQUE_RESOURCE_ID++,
      entityId: !!this.applicableVehicles && this.applicableVehicles.length > 0 && this.applicableVehicles[0].id,
      entityType: ResourceType.VEHICLE,
      editable: true,
      removable: true,
      entity: !!this.applicableVehicles && this.applicableVehicles.length > 0 && this.applicableVehicles[0]
    }
    resources.push(nextResource);
  }
  deleteResource(index: number) {
    this.tripData.resources.splice(index, 1);
  }

  closeTripModal() {
    this._addTripModal.hide();
  }

  /**
   * Unassign Trip modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("unassignTripModal") _unassignTripModal: ModalDirective;
  unassignTrip: any = {};

  onTripDrop(event: any) {
    this.unassignTrip = event.dragData;
    this._unassignTripModal.show();
  }

  closeUnassignTripModal() {
    this._unassignTripModal.hide();
  }
  doUnassignTrip() {
    this.restService.deleteTrip(this.unassignTrip.trip.id)
      .subscribe(
        success => {
          this._unassignTripModal.hide();
          this.reloadBookings(false);
          this.reloadTrips(false);
        }
      );
  }

  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;
  connections: Connection[] = [];
  connectionsLoaded: boolean = false;
  drivers: Driver[];
  activeDrivers: Driver[];
  driversLoaded: boolean = false;
  tripsHandler: TripsHandler;
  items: TripsHandlerItem[] = [];
  itemsFilter: {
    filteredItems: TripsHandlerItem[],
    paginatedItems: {
      array: TripsHandlerItem[],
      begin: number,
      end: number
    }
  } = {
      filteredItems: [],
      paginatedItems: {
        array: [],
        begin: 0,
        end: 0
      }
    };

  bookings: Booking[] = [];
  bookingsFilter: {
    filteredBookings: Booking[],
    paginatedBookings: {
      array: Booking[],
      begin: number,
      end: number
    }
  } = {
      filteredBookings: [],
      paginatedBookings: {
        array: [],
        begin: 0,
        end: 0
      }
    };

  // Trips table
  tSearch: string = "";
  tripStatuses = TripStatus;
  tabStatuses = {
    "Plan": [TripStatus.PREASSIGNED, TripStatus.DISPATCHED],
    "Current": [TripStatus.DISPATCHED, TripStatus.ON_HOLD, TripStatus.APPROVED],
    "Complete": [TripStatus.COMPLETE]
  };
  tripsTab: string = "Plan";
  tripsStatuses = this.tabStatuses[this.tripsTab];
  showCurrent() {
    this.tripsTab = "Current";
    this.tripsStatuses = this.tabStatuses[this.tripsTab];
    this.reloadTrips();
  }
  showPlan() {
    this.tripsTab = "Plan";
    this.tripsStatuses = this.tabStatuses[this.tripsTab];
    this.reloadTrips();
  }
  showComplete() {
    this.tripsTab = "Complete";
    this.tripsStatuses = this.tabStatuses[this.tripsTab];
    this.reloadTrips();
  }

  tripsPage: number = 1;
  tripsPageSize: number = 5;
  changeTripsPage(newPage) {
    this.tripsPage = newPage;
  }

  /**
   * Doing client side filtering: ordering, pagination, horizontal tabulation logic.
   */
  initializeItems(refresh: boolean) {
    if (refresh) {
      this.tSearch = "";
    }
    this.items = this.tripsHandler.getItems(this.entityType);
    this.changeTripsPage(refresh ? 1 : this.tripsPage);
    this.initializeTripsCollapseMap(refresh);
  }

  tripsCollapseMap: any = {};
  initializeTripsCollapseMap(refresh: boolean) {
    if (refresh) {
      this.tripsCollapseMap = {};
    }
    this.items.forEach(item => {
      let entityId: string = item.getEntity().id;
      item.trips.forEach(trip => {
        let tripId = trip.id;
        let oldValue = !!this.tripsCollapseMap[`${entityId}.${tripId}`];
        this.tripsCollapseMap[`${entityId}.${tripId}`] = oldValue;
      });
    });
  }

  /**
   * Doing server side request for trips and call `initializeItems()` to do filtering.
   */
  reloadTrips(refresh: boolean = true) {
    this.restService.get1000Trips(this.tripsStatuses, this.dispatchGroupId)
      .subscribe(result => {
        this.tripsHandler = result;
        this.tripsHandler.initWith(this.vehicles, this.drivers);
        this.initializeItems(refresh);
      });
  }

  entityType = ResourceType.VEHICLE;
  entityTypes = ResourceType;
  showVehicle() {
    this.entityType = ResourceType.VEHICLE;
    this.initializeItems(true);
  }
  showDriver() {
    this.entityType = ResourceType.DRIVER;
    this.initializeItems(true);
  }

  // Bookings table
  bSearch: string = "";
  status: string = BookingStatus.AVAILABLE;
  statuses = BookingStatus;
  showAvailable() {
    this.status = BookingStatus.AVAILABLE;
    this.reloadBookings();
  }
  showDispatched() {
    this.status = BookingStatus.DISPATCHED;
    this.reloadBookings();
  }
  showCompleted() {
    this.status = BookingStatus.COMPLETED;
    this.reloadBookings();
  }

  reloadBookings(refresh: boolean = true) {
    this.restService.get1000Bookings(this.status)
      .subscribe(result => {
        this.bookings = result;
        this.bookings.forEach(b => b.stops.sort((a, b) => {
          return new Date(a.appointmentFrom).getTime() - new Date(b.appointmentFrom).getTime();
        }));
        this.initializeBookings(refresh);
      });
  }

  /**
   * Doing client side filtering: filtering, ordering, pagination.
   */
  initializeBookings(refresh: boolean) {
    if (refresh) {
      this.bSearch = "";
    }
    this.changeBookingsPage(refresh ? 1 : this.bookingsPage);
    this.initializeBookingsCollapseMap(refresh);
  }

  bookingsCollapseMap: any = {};
  initializeBookingsCollapseMap(refresh: boolean) {
    if (refresh) {
      this.bookingsCollapseMap = {};
    }
    this.bookings.forEach(booking => {
      let oldValue = !!this.bookingsCollapseMap[`${booking.id}`];
      this.bookingsCollapseMap[`${booking.id}`] = oldValue;
    });
  }

  bookingsPage: number = 1;
  bookingsPageSize: number = 10;
  changeBookingsPage(newPage) {
    this.bookingsPage = newPage;
  }

  constructor(
    private restService: RestService,
    private dateService: DateService,
    private addressUtil: AddressUtil,
    private storage: StorageService,) { }

  reloadTimer: Subscription;

  ngOnInit() {
    this.loadTripsTable();

    this.storage.get(HIDE_BOOKINGS).then(hide => {
      this.showBookings(!hide);
    })

    this.reloadTimer = interval(FIVE_MINUTE_MILLIS)
      .subscribe(x => {
        console.log("Refreshing dispatch board (every 5 minutes)...");
        this.reloadTrips(false);
        this.reloadBookings(false);
      });
  }

  ngOnDestroy(): void {
    this.reloadTimer.unsubscribe();
  }

  loadTripsTable() {
    combineLatest(
      this.restService.get1000Vehicles(), // ordered by remoteId.ASC
      this.restService.get1000Connections(), // ordered by creatredAt.DESC
      this.restService.get1000Drivers(), // ordered by remoteId.ASC
      this.restService.get1000DispatchGroupsLight()
    ).subscribe(
      data => {
        this.vehicles = data[0];
        this.vehiclesLoaded = true;

        this.connections = data[1];
        this.connectionsLoaded = true;

        this.drivers = data[2];
        this.activeDrivers = this.drivers.filter(
          driver => driver.status === Status.ACTIVE);
        this.driversLoaded = true;

        this.dispatchGroups = data[3];
        this.storage.get(DISPATCH_GROUP_ID).then(id => {
          if (id && this.dispatchGroups.find(group => group.id === id)) {
            this.dispatchGroupId = id;
          }
          this.reloadTrips();
        })
      }
    );
  }

  loadBookingsTable() {
    this.bookingsTableLoaded = true;
    this.restService.get1000FeedbackTypes()
      .subscribe(result => {
        this.feedbackTypes = result;

        combineLatest(
          this.restService.get1000Customers(),
          this.restService.get1000VehicleTypes(),
          this.restService.get1000Locations()
        ).subscribe(
          data => {
            this.customers = data[0];
            this.customersLoaded = true;

            this.types = data[1];
            this.typesLoaded = true;

            this.locations = data[2];
          });
      });
    this.reloadBookings();
  }

  /**
   * Add Booking logic.
   */
  bookingsTableLoaded: boolean = false;
  customers: Customer[];
  customersLoaded: boolean = false;
  types: VehicleType[] = [];
  typesLoaded: boolean = false;
  feedbackTypes: FeedbackType[];
  locations: DomicileLocation[] = [];

  refreshBookingsTable() {
    this.reloadBookings(false);
  }

  /**
   * Bookings switch
   */

  visibleBookings: boolean = true;

  showBookings(visible: boolean) {
    this.visibleBookings = visible;
    this.tripsPageSize = this.visibleBookings ? 5 : 15;
    this.storage.set(HIDE_BOOKINGS, !visible);
    if (visible) {
      if (!this.bookingsTableLoaded) {
        this.loadBookingsTable();
      } else {
        this.refreshBookingsTable();
      }
    }
  }

  /**
   * Filter by dispatch group
   */

  dispatchGroupId = null;
  dispatchGroups = [];

  changeDispatchGroup() {
    if (this.dispatchGroupId) {
      this.storage.set(DISPATCH_GROUP_ID, this.dispatchGroupId);
    } else {
      this.storage.remove(DISPATCH_GROUP_ID);
    }
    this.reloadTrips();
  }

}
