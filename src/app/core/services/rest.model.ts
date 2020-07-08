import { Exclude, Type } from "class-transformer";
import * as moment from 'moment';
import _minBy from 'lodash/minBy';
import _maxBy from 'lodash/maxBy';

import { TABLE_LENGTH_ATTRIBUTE, TABLE_LENGTH_DEFAULT, ENTRY_POINT_ATTRIBUTE, ENTRY_POINT_DEFAULT, ENTRY_POINT_ADMIN_DEFAULT } from "@app/core/smartadmin.config";

export class DateUtil {

    public static compareDate(date1: Date, date2: Date): number {
        // With Date object we can compare dates using the >, <, <= or >=.
        // The ==, !=, ===, and !== operators require to use date.getTime(),
        // so we need to create a new instance of Date with 'new Date()'
        let d1 = new Date(date1);
        let d2 = new Date(date2);

        let same = d1.getTime() === d2.getTime();
        if (same) return 0;
        if (d1 > d2) return 1;
        if (d1 < d2) return -1;
    }

    public static compareStringDate(date1: string, date2: string): number {
        let d1 = moment.utc(date1).toDate();
        let d2 = moment.utc(date2).toDate();
        return this.compareDate(d1, d2);
    }

    public static setEOD(date: Date): void {
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
    }

}

export enum StopLoadType {
    EMPTY = "EMPTY",
    LOADED = "LOADED"
}

export enum BookingStatus {
    AVAILABLE = "Available",
    DISPATCHED = "Dispatched",
    COMPLETED = "Completed",
    ALL = "All",
}

export enum ResourceType {
    VEHICLE = "Vehicle",
    DRIVER = "Driver"
}

export enum TripStatus {
    PREASSIGNED = "PREASSIGNED", // Plan
    DISPATCHED = "DISPATCHED", // Plan
    ON_HOLD = "ON HOLD", // Current
    APPROVED = "APPROVED", // Current
    COMPLETE = "COMPLETE", // Complete
}

export enum ChangeLogInitiatorType {
    CONNECTION = "Connection",
    DRIVER = "Driver",
    WEB_USER = "Web User"
}

export enum ChangeLogType {
    CREATED = "Created",
    STATUS_CHANGED = "StatusChanged"
}

export enum Status {
    ACTIVE = "(active)",
    DELETED = "(deleted)",
}

export enum RoleType {
    ADMIN = "ROLE_SUPER_ADMIN",
    OWNER = "ROLE_OWNER",
    USER = "ROLE_USER"
}

export enum DiscountType {
    FLAT = "FLAT",
    VARIABLE = "VARIABLE"
}

export enum EntityType {
    DRIVER = "Driver",
    VEHICLE = "Vehicle",
    REPORTING_PROFILE = "ReportingProfile",
    CONNECTION = "Connection",
    COMPANY = "Company",
    LOCATION = "Location",
}

export class EntityTypeUtil {
    public static getFAIcon(type: EntityType) {
        switch (type) {
            case EntityType.DRIVER:
                return "fa-user";
            case EntityType.VEHICLE:
                return "fa-truck";
            case EntityType.REPORTING_PROFILE:
                return "fa-files-o";
            case EntityType.CONNECTION:
                return "fa-link";
            default:
                return "fa-exclamation";
        }
    }

    public static getEntityType(entityType: string): EntityType {
        if (!entityType) {
            return null;
        }
        if (entityType.includes("Driver")) {
            return EntityType.DRIVER;
        }
        if (entityType.includes("Vehicle")) {
            return EntityType.VEHICLE;
        }
        if (entityType.includes("ReportingProfile")) {
            return EntityType.REPORTING_PROFILE;
        }
        if (entityType.includes("Connection")) {
            return EntityType.CONNECTION;
        }
        if (entityType.includes("Company")) {
            return EntityType.COMPANY;
        }
    }

    public static getURI(entityType: string, entityId: string): string {
        if (!entityType || !entityId) {
            return null;
        }
        switch (entityType) {
            case EntityType.DRIVER:
                return `#/drivers/${entityId}/view`;
            case EntityType.VEHICLE:
                return `#/vehicles/${entityId}/view`;
            case EntityType.REPORTING_PROFILE:
                return `#/reporting/${entityId}/view`;
            case EntityType.CONNECTION:
                return `#/company/connections/${entityId}/view`;
            default:
                return null;
        }
    }
}

export class ReportTypeUtil {
    public static getReportNames(types: ReportType[]) {
        if (!types || types.length === 0) {
            return [];
        }
        let result: string[] = [];
        types.forEach(type => {
            result.push(...type.reportNames);
        });
        return result;
    }
}

export class Dictionary {
    [key: string]: string;
}

export abstract class Reportable {
    id: string;
    availableReports: any;

    constructor() { }

    getProductTypes(): string[] {
        if (!this.availableReports) {
            return [];
        }
        return Object.keys(this.availableReports);
    }

    getReportNames(productType: string): string[] {
        if (!this.availableReports) {
            return [];
        }
        return this.availableReports[productType] || [];
    }
}

export class Product {
    readonly type: string;
    readonly description: string;
    readonly availableReports: string[];

    constructor() { }
}

export class ProductEstimation {
    readonly type: string;
    readonly reportingProfileId: string;
    readonly estimatedQuantity: number;
    readonly estimatedAmount: number;
    readonly billingUnit: string;

    constructor() { }

    estimatedTotalAmount() {
        if (!this.estimatedQuantity || !this.estimatedAmount) {
            return 0;
        }
        return this.estimatedQuantity * this.estimatedAmount;
    }
}

export class Attribute {
    readonly name: string;
    readonly value: string;

    constructor();

    constructor(name: string, value: string);

    constructor(name?: string, value?: string) {
        this.name = name || null;
        this.value = value || null;
    }
}

export class User {
    readonly id;
    readonly username: string;
    readonly email: string;
    readonly phone: string;
    readonly enabled: boolean;
    readonly lastLogin: string;
    readonly roles: string[];
    readonly timezone: string;
    readonly firstName: string;
    readonly lastName: string;
    @Type(() => Attribute)
    readonly attributes: Attribute[];

    constructor() { }

    getAttribute(name: string): string {
        if (!!this.attributes && this.attributes.length > 0) {
            let attribute = this.attributes.find(function (next) {
                return next.name === name;
            });
            if (!!attribute) {
                return attribute.value;
            }
        }
        return null;
    }

    getEntryPoint(): string {
        let entryPoint = this.getAttribute(ENTRY_POINT_ATTRIBUTE);
        return !!entryPoint ? entryPoint : (this.isAdmin() ? ENTRY_POINT_ADMIN_DEFAULT : ENTRY_POINT_DEFAULT);
    }

    getTableLength(): number {
        let tableLength = this.getAttribute(TABLE_LENGTH_ATTRIBUTE);
        return !!tableLength ? +tableLength : TABLE_LENGTH_DEFAULT;
    }

    name(): string {
        if (this.firstName || this.lastName) {
            let first: string = this.firstName || "";
            let last: string = this.lastName || "";
            return `${first} ${last}`;
        }
        return this.email;
    }

    isAdmin(): boolean {
        return this.roles && this.roles.includes(RoleType.ADMIN);
    }

    isOwner(): boolean {
        return this.roles && this.roles.includes(RoleType.OWNER);
    }

    isUser(): boolean {
        return this.roles && !this.roles.includes(RoleType.ADMIN);
    }
}

export class StatisticPoint {
    readonly datetime: string;
    readonly value: number;

    constructor() { }
}

export class StatisticSeries {
    readonly total: number;
    readonly name: string;
    @Type(() => StatisticPoint)
    readonly points: StatisticPoint[];
    readonly unit: string;

    constructor() { }
}

export class Statistics {
    readonly percentChange: number;
    readonly dataSetName: string;
    readonly reportPeriodType: string;
    @Type(() => StatisticSeries)
    readonly series: StatisticSeries[];

    constructor() { }

    getSeriesData(): any[] {
        let result = [];
        this.series.forEach(s => {
            let sData = s.points.map(function (p: StatisticPoint) {
                return [p.datetime, p.value];
            });
            result.push(sData);
        });
        return result;
    }

    getUnit() {
        return (this.series && this.series.length > 0 && this.series[0].unit) || "";
    }
    getTotals() {
        if (this.series && this.series.length === 2) {
            return `(${this.series[1].total.toFixed(1)} → ${this.series[0].total.toFixed(1)})`;
        }
        return "";
    }
}

export class AuthInfo {
    readonly apiKey: string;
    @Type(() => User)
    readonly user: User;

    constructor() { }
}

export class Invoice {
    readonly id: string;
    readonly date: string;
    readonly amount: number;

    constructor() { }
}

export class DiscountContext {
    readonly applicable: boolean;
    readonly availableDiscountAmount: number;
    readonly discountPercent: number;
    readonly availableDiscountApplying: number;

    constructor() { }
}

export class Discount {
    readonly id: string;
    readonly name: string;
    readonly type: string; // DiscountType
    readonly createdAt: string;
    readonly applicable: boolean;

    @Type(() => DiscountContext)
    readonly context: DiscountContext;

    constructor() { }
}

export class Address {
    readonly line1: string;
    readonly line2: string;
    readonly city: string;
    readonly state: string;
    readonly country: string;
    readonly zip: string;

    constructor() { }

    getAddress() {
        let address: string = (this.line1 ? this.line1 + " " : "") +
            (this.line2 ? this.line2 + " " : "") +
            ((this.line1 || this.line2) ? " - " : "") +
            (this.city ? this.city + ", " : "") +
            (this.state ? this.state + " " : "") +
            (this.country ? this.country + " " : "") +
            (this.zip ? this.zip + "" : "");
        return address || "N/A";
    }
}

export class Customer {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly status: string; // Active, Inactive
    readonly createdAt: string;

    @Type(() => Address)
    readonly billingAddress: Address;
    @Type(() => Address)
    readonly physicalAddress: Address;

    constructor() { }

    isActive() {
        return "Active" === this.status;
    }
}

export class CompanyFeatures {
    readonly fuel: boolean;
    readonly dispatching: boolean;
    readonly frontline: boolean;
    readonly devices: boolean;

    constructor() { }
}

export class Company extends Reportable {
    readonly name: string;
    readonly address1: string;
    readonly address2: string;
    readonly city: string;
    readonly state: string;
    readonly zip: string;
    readonly billedOn: number;
    readonly devicesEnabled: boolean;
    readonly creditAllowed: boolean;
    readonly mRR: number;

    @Type(() => ReportingProfile)
    readonly defaultReportingProfile: ReportingProfile;

    @Type(() => ReportingProfile)
    readonly reportingProfiles: ReportingProfile[];

    @Type(() => StripeCustomer)
    readonly stripeCustomer: StripeCustomer;

    @Type(() => User)
    readonly users: User[];

    @Type(() => Invoice)
    readonly lastInvoice: Invoice;

    @Type(() => CompanyFeatures)
    readonly enabledFeatures: CompanyFeatures;

    constructor() {
        super();
    }

    getFirstOwner(): User {
        if (!this.users || this.users.length === 0) {
            return null;
        }
        return this.users.find(function (next) {
            return next.isOwner();
        });
    }

    getDefaultSource(): Source {
        if (!this.stripeCustomer || !this.stripeCustomer.sources ||
            !this.stripeCustomer.sources.data || this.stripeCustomer.sources.data.length == 0) {
            return null;
        }
        let defaultId = this.stripeCustomer.default_source;
        if (!defaultId) {
            return this.stripeCustomer.sources.data[0];
        }
        let result = this.stripeCustomer.sources.data.find(function (element) {
            return element.id === defaultId;
        });
        return result;
    }

    /**
     * Returns list of profiles with active subscriptions.
     *
     * @returns {ReportingProfile[]} result list of `ReportingProfile` instances
     */
    getProfilesWithActiveSubscription(): ReportingProfile[] {
        if (!this.reportingProfiles || this.reportingProfiles.length === 0) {
            return [];
        }
        return this.reportingProfiles.filter(
            profile => profile.hasActiveSubscription());
    }

    totalAmount(): number {
        if (!this.reportingProfiles || this.reportingProfiles.length === 0) {
            return 0;
        }
        let result = 0;
        this.reportingProfiles.forEach(function (reporting) {
            result += reporting.totalAmount();
        });
        return result;
    }
}

export class DispatchGroup {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string;
    @Type(() => Company)
    readonly company: Company;

    constructor() { }
}

export class VehicleType {
    readonly id: string;
    readonly type: string;
    readonly description: string;
    readonly tareWeight: number;
    readonly volume: number;
    readonly capacity: number;
    readonly createdAt: string;
    @Type(() => Company)
    readonly company: Company;

    constructor() { }
}

export class FuelStatistics {
    readonly averagePrice: number;
    readonly averageEconomy: number;
    readonly averageCostPerMile: number;

    constructor() { }
}

export class TransactionLine {
    readonly id: string;
    readonly createdAt: string;
    readonly amount: number;
    readonly category: string;
    readonly ppu: number;
    readonly quantity: number;

    constructor() { }
}

export class FuelTransaction {
    readonly id: string;
    readonly transactionId: number;
    readonly vehicleRemoteId: string;

    readonly createdAt: string;
    readonly posDate: string;

    readonly billingCurrency: string;
    readonly cardNumber: string;
    readonly conversionRate: number;
    readonly discountAmount: number;
    readonly discountType: string;
    readonly quantity: number;
    readonly pricePer: number;
    readonly fundedTotal: number;
    readonly locationName: string;
    readonly locationState: string;
    readonly prefTotal: number;
    readonly settleAmount: number;

    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    @Type(() => Company)
    readonly company: Company;
    @Type(() => TransactionLine)
    readonly transactionLines: TransactionLine[];

    constructor() { }
}

export class DeviceProfile {
    readonly id: string;
    readonly name: string;
    readonly policyName: string;
    readonly status: string;
    readonly deactivatedAt: string;
    readonly createdAt: string;

    constructor() { }

    isActive(): boolean {
        return "active" === this.status;
    }
}

export class Device {
    readonly id: string;

    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;
    @Type(() => Company)
    readonly company: Company;

    readonly iccid: string;
    readonly imei: string;
    readonly tokenName: string;
    readonly qrCode: string;
    readonly type: string;

    @Type(() => Vehicle)
    readonly lastVehicle: Vehicle;
    readonly softwareVersion: string;
    readonly status: string;
    readonly deactivatedAt: string;
    readonly createdAt: string;

    constructor() { }

    isActive(): boolean {
        return "active" === this.status;
    }

    isConnected(): boolean {
        let odometerDefined = this.lastVehicle && this.lastVehicle.lastPosition
            && this.lastVehicle.lastPosition.odometer && this.lastVehicle.lastPosition.odometer > 0;
        let ignition = this.lastVehicle && this.lastVehicle.lastPosition && this.lastVehicle.lastPosition.ignition;
        return !!odometerDefined || !!ignition;
    }
}

export class StripeCustomer {
    readonly id: string;
    readonly default_source: string;
    readonly sources: Sources;

    constructor() { }
}

export class Sources {
    readonly total_count: number;
    readonly data: Source[];

    constructor() { }
}

export class Source {
    readonly id: string;
    readonly name: string;
    readonly object: string;
    readonly address_city: string;
    readonly address_country: string;
    readonly address_line1: string;
    readonly address_line2: string;
    readonly address_state: string;
    readonly address_zip: string;
    readonly brand: string;
    readonly country: string;
    readonly last4: string;

    constructor() { }

    getAddress() {
        let address: string = (this.address_line1 && this.address_line1 + "\n") +
            (this.address_line2 && this.address_line2 + "\n") +
            (this.address_city && this.address_city + ",&nbsp;") +
            (this.address_state && this.address_state + "&nbsp;") +
            (this.address_zip);
        return address || "N/A";
    }
}

export class Point {
    x: number;
    y: number;

    constructor() { }
}

export class Polygon {
    rings: number[][];

    constructor() { }
}

export class MapboxPlace {
    readonly place_name: string;
    readonly center: number[];
    readonly bbox: number[];

    constructor() { }
}

export class DomicileLocation {
    readonly id: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly name: string;
    @Type(() => Point)
    readonly point: Point;
    @Type(() => Polygon)
    readonly polygon: Polygon;
    readonly locationGroupId: string;
    readonly createdAt: number;
    readonly allowEdit: boolean;
    readonly address1: string;
    readonly address2: string;
    readonly city: string;
    readonly state: string;
    readonly country: string;
    readonly zip: string;

    constructor() { }

    getAddress() {
        let address: string = (this.address1 ? this.address1 + " " : "") +
            (this.address2 ? this.address2 + " " : "") +
            ((this.address1 || this.address2) ? " - " : "") +
            (this.city ? this.city + ", " : "") +
            (this.state ? this.state + " " : "") +
            (this.country ? this.country + " " : "") +
            (this.zip ? this.zip + "" : "");
        return address || "N/A";
    }

    prepareProperties() {
        return {
            // Will be stringified by mapbox, so use `JSON.parse(xxx.properties.asString)` before usage
            asString: this
        }
    }

    isPolygon() {
        return this.polygon && this.polygon.rings && this.polygon.rings.length > 0;
    }

    isPoint() {
        return !!this.point && !!this.point.x;
    }

    prepareGeometry() {
        return {
            type: "Polygon",
            coordinates: this.polygon.rings
        }
    }

    preparePointGeometry() {
        return {
            type: "Point",
            coordinates: [this.point.x, this.point.y]
        };
    }

    getClickablePoint() {
        return this.isPolygon() ? this.polygon.rings[0][0] : [this.point.x, this.point.y];
    }

    hasLonLat() {
        return !!this.latitude && !!this.longitude;
    }

}

export class LocationWrapper {
    readonly isLocation: boolean;
    readonly entry: any;

    constructor(isLocation: boolean, entry: any) {
        this.isLocation = isLocation;
        this.entry = entry;
    }
}

export class DwellStat {
    readonly date: string; // Date format is: 'YYYY-MM-DD'
    readonly hour: number;
    readonly duration: number;

    constructor() { }
}

export class DwellStatsHelper {
    readonly dwellStats: DwellStat[];

    constructor(dwellStats: DwellStat[]) {
        this.dwellStats = dwellStats;
    }

    getSeriesData(): any[] {
        let result = [];
        this.dwellStats.forEach(ds => {
            let date: Date = moment.utc(ds.date, 'YYYY-MM-DD').toDate();
            date.setUTCHours(ds.hour);

            result.push([date.getTime(), ds.duration]);
        });
        return [result];
    }
}

export class DwellEvent {
    readonly id: string;
    readonly startedAt: string;
    readonly endedAt: string;
    readonly duration: number;

    @Type(() => DomicileLocation)
    readonly location: DomicileLocation;
    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    readonly createdAt: string;

    constructor() { }
}

export class PositionFormat {
    readonly iconType: string;
    readonly iconColor: string;
    readonly lineAfterColor: string;
    readonly lineAfterType: string;
    readonly allowInsertBefore: boolean;

    constructor() { }
}

export class Position {
    readonly id: string;
    readonly datetime: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly road: string;
    readonly city: string;
    readonly state: string;
    readonly odometer: number;
    readonly driverId: string;
    readonly heading: number;
    readonly speed: number;
    readonly gpsVelocity: number;
    readonly ignition: boolean;
    readonly error: string;
    @Type(() => PositionFormat)
    readonly format: PositionFormat;
    @Type(() => DomicileLocation)
    readonly locations: DomicileLocation[];

    constructor() { }

    getLocation() {
        return (!this.road ? "" : this.road + ", ") +
            (!this.city ? "" : this.city + " ") +
            (!this.state ? "" : this.state);
    }

    getLocationNames() {
        if (!this.locations || this.locations.length === 0) {
            return "";
        }

        return this.locations
            .map(attr => attr.name)
            .join(", ");
    }

    getRotation() {
        return (this.format.iconType === `heading-arrow`) ? this.heading : 0;
    }

    toIcon() {
        switch (this.format.iconType) {
            case `exclamation`:
                return "fa-exclamation";
            case `heading-arrow`:
                return "fa-arrow-up";
            default:
                return "fa-circle";
        }
    }

    isNotProcessed() {
        return this.format && this.format.iconColor === "purple";
    }

    isError() {
        return !!this.error;
    }

}

export class PointFeature {
    positionId: string;
    coordinates: number[];
    rotation: number;
    color: string;
    icon: string;
    hover: boolean

    constructor(positionId: string, coordinates: number[], rotation: number,
        color: string, icon: string) {
        this.positionId = positionId;
        this.coordinates = coordinates;
        this.rotation = rotation;
        this.color = color;
        this.icon = icon;
        this.hover = false;
    }
}

export class PositionsData {
    @Type(() => Position)
    readonly tablePositions: Position[];
    @Type(() => Position)
    readonly mapPositions: Position[];
    readonly resultCount: number;

    constructor() { }

    preparePointFeatures(): PointFeature[] {
        if (!this.tablePositions || this.tablePositions.length === 0) {
            return [];
        }
        let result = [];
        this.tablePositions.forEach(function (p) {
            let next = new PointFeature(
                p.id,
                [p.longitude, p.latitude],
                p.getRotation(),
                p.format.iconColor, p.toIcon());
            result.push(next);
        });
        return result;
    }

    /**
     * Since `line-dasharray` of Mapbox doesn't support property functions, we need to return 2 set
     * of lines: dashed and solid.
     *
     * @see https://github.com/mapbox/mapbox-gl-js/issues/3045
     */
    prepareLineFeatures() {
        if (!this.mapPositions || this.mapPositions.length <= 1) {
            return {
                dotted: [],
                solid: []
            };
        }

        let resultSolid = [];
        let resultDotted = [];
        const amount = this.mapPositions.length;
        for (let i = amount - 1; i > 0; i--) {
            let a = this.mapPositions[i];
            let b = this.mapPositions[i - 1];
            let notProcessed = a.format.lineAfterColor === "none";
            // if (notProcessed) {
            //     continue;
            // }
            let color = notProcessed ? "purple" : a.format.lineAfterColor;
            let width = notProcessed ? 1 : 3;
            let next = {
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [a.longitude, a.latitude],
                        [b.longitude, b.latitude]
                    ]
                },
                properties: {
                    color: color,
                    width: width
                }
            };

            let isDotted = notProcessed || a.format.lineAfterType == "dotted";
            if (isDotted) {
                resultDotted.push(next);
            } else {
                resultSolid.push(next);
            }
        }

        return {
            dotted: resultDotted,
            solid: resultSolid
        };
    }
}

export class FeedbackType {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly createdAt: string;

    constructor() { }
}

export class Stop {
    readonly id: string;
    readonly stopOrder: number;
    readonly arriveDate: string;
    readonly type: string; // ?
    readonly loadedType: string; // EMPTY, LOADED
    readonly createdAt: string;
    readonly appointmentFrom: string;

    @Type(() => Address)
    readonly address: Address;
    @Type(() => DomicileLocation)
    readonly location: DomicileLocation;
    @Type(() => FeedbackType)
    readonly requiredFeedbackTypes: FeedbackType[];

    constructor() { }

    isLocation() {
        return !!this.location && !!this.location.id;
    }

    getFeedbackTypesText() {
        if (!!this.requiredFeedbackTypes && this.requiredFeedbackTypes.length > 0) {
            return this.requiredFeedbackTypes.map(type => (type.name)).join(", ");
        }
        return "";
    }
}

export class Booking {
    readonly id: string;
    readonly status: string;
    readonly bookNo: string;
    readonly billingName: string;
    readonly createdAt: string;
    readonly hold: boolean;
    // readonly bolNo: string; // ?
    // readonly notes: string; // ?

    @Type(() => Address)
    readonly billingAddress: Address;
    @Type(() => Customer)
    readonly customer: Customer;
    @Type(() => VehicleType)
    readonly vehicleType: VehicleType;
    @Type(() => Stop)
    readonly stops: Stop[];

    constructor() { }

    /**
     * Calculates based on the `Stop.appointmentFrom` field.
     */
    filterStops(type?: string) {
        return (this.stops || []).filter((s) => !type || s.type === type);
    }

    getFirstStop(type?: string) {
        return _minBy(this.filterStops(type), (s) => new Date(s.appointmentFrom).getTime());
    }

    getLastStop(type?: string) {
        return _maxBy(this.filterStops(type), (s) => new Date(s.appointmentFrom).getTime());
    }
}

export class Resource {
    readonly entityType: string; // ResourceType
    readonly entityId: string;
    // @Type(() => VehicleType)
    // readonly vehicleType: VehicleType;
    readonly serviceStatus: string;
    readonly loadStatus: string;

    constructor() { }
}

export class Dispatch {
    readonly id: string;
    @Type(() => Resource)
    readonly resource: Resource;
    // readonly estimatedTimeToCompletion: string,
    readonly createdAt: string;

    constructor() { }
}

export class Trip {
    readonly id: string;
    readonly tripNo: string;
    readonly status: string; // TripStatus
    readonly completedAt: string;
    readonly approvedAt: string;
    @Type(() => User)
    readonly createdBy: User;
    readonly dispatchOrder: number;
    @Type(() => Stop)
    readonly stops: Stop[];
    @Type(() => Dispatch)
    readonly dispatches: Dispatch[];
    readonly createdAt: string;

    constructor() { }

    hasOneOfStatuses(statuses: string[]): boolean {
        return !!statuses && statuses.includes(this.status);
    }

    /**
     * Calculates based on the `Stop.appointmentFrom` field.
     */
    filterStops(type?: string) {
        return (this.stops || []).filter((s) => !type || s.type === type);
    }

    getFirstStop(type?: string) {
        return _minBy(this.filterStops(type), (s) => new Date(s.appointmentFrom).getTime());
    }

    getLastStop(type?: string) {
        return _maxBy(this.filterStops(type), (s) => new Date(s.appointmentFrom).getTime());
    }
}

export class ChangeLogInitiator {
    readonly type: string; // ChangeLogInitiatorType
    readonly id: string;
}

export class ChangeLogContext {
    readonly newStatus: string; // TripStatus
    readonly prevStatus: string; // TripStatus

    constructor() { }
}

export class TripChangeLog {
    readonly id: string;
    readonly event: string; // ChangeLogType
    @Type(() => ChangeLogInitiator)
    readonly initiator: ChangeLogInitiator;
    @Type(() => ChangeLogContext)
    readonly context: ChangeLogContext;
    readonly createdAt: string;

    constructor() { }
}

/**
 * Helper item representation class for the Trips list (Dispatch logic)
 */
export class TripsHandlerItem {
    readonly vehicle: Vehicle;
    readonly driver: Driver;
    readonly trips: Trip[];

    constructor(entity: Reportable, trips: Trip[]) {
        this.vehicle = entity instanceof Vehicle ? entity : null;
        this.driver = entity instanceof Driver ? entity : null;
        this.trips = trips;
    }

    getEntity(): Reportable {
        return !!this.vehicle ? this.vehicle : this.driver;
    }
}

export class TripsHandler {

    /**
     * Will be ordered by `Trip.createdAt.DESC` and grouped by the entity (either Driver or Vehicle)
     *
     * @type {TripsHandlerItem[]}
     * @memberof TripsHandler
     */
    private vehicleItems: TripsHandlerItem[];
    private driverItems: TripsHandlerItem[];
    private isInit: boolean = false;

    getItems(entityType: ResourceType): TripsHandlerItem[] {
        if (!this.isInit) {
            throw new Error("Need to call #initWith() first.");
        }
        return entityType === ResourceType.VEHICLE ? this.vehicleItems : this.driverItems;
    }

    readonly trips: Trip[];
    private vehicles: Vehicle[];
    private drivers: Driver[];

    constructor(trips: Trip[]) {
        this.trips = trips;
        this.trips.forEach(trip => trip.stops.sort((a, b) => {
            return new Date(a.appointmentFrom).getTime() - new Date(b.appointmentFrom).getTime();
        }));
        this.trips.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === TripStatus.DISPATCHED ? -1 : 1;
            }
            let s1 = a.getFirstStop('PICKUP');
            let s2 = b.getFirstStop('PICKUP');
            if (!s1) return 1;
            if (!s2) return -1;
            return new Date(s1.appointmentFrom).getTime() - new Date(s2.appointmentFrom).getTime();
        });
    }

    initWith(vehicles: Vehicle[], drivers: Driver[]) {
        this.vehicles = vehicles;
        this.drivers = drivers;

        this.vehicleItems = this.mapCollection(this.trips, this.vehicles, ResourceType.VEHICLE);
        this.driverItems = this.mapCollection(this.trips, this.drivers, ResourceType.DRIVER);
        this.isInit = true;
    }

    /**
     * Helper method to map trips array to the UI representable array of `TripsHandlerItem` instances.
     * 
     * Will return result array ordered similar with the `entities` array order. In our case sorting willl
     * be `remoteId.ASC` for both drivers and vehicles.
     * 
     * @private
     * @param {Trip[]} trips array of `Trip` instances to map
     * @param {Reportable[]} entities array of entities (`Vehicle`s or `Driver`s) to do map based on
     * @param {ResourceType} entityType entity type
     * @returns {TripsHandlerItem[]} the result representable array
     * @memberof TripsHandler
     */
    private mapCollection(trips: Trip[], entities: Reportable[], entityType: ResourceType): TripsHandlerItem[] {
        // let entitiesMap = entities.reduce((map: Map<string, Reportable>, item) => map.set(item.id, item), new Map());

        let tripsById = {};
        trips.forEach(function (trip: Trip) {
            if (!!trip.dispatches && trip.dispatches.length > 0) {
                trip.dispatches.forEach(dispatch => {
                    let entityId = dispatch.resource.entityId;
                    if (dispatch.resource.entityType === entityType) {
                        let theTrips = tripsById[entityId];
                        if (!theTrips) {
                            tripsById[entityId] = [trip];
                        } else {
                            theTrips.push(trip);
                        }
                    }
                });
            }
        });

        let result: TripsHandlerItem[] = [];
        entities.forEach((next: Reportable) => {
            let theTrips = tripsById[next.id];
            if (!!theTrips) {
                let item = new TripsHandlerItem(next, theTrips);
                result.push(item);
            }
        });
        result.sort((a, b) => {
            let s1 = a.trips[0].status;
            let s2 = b.trips[0].status;
            if (s1 === s2) {
                return 0;
            }
            return s1 === TripStatus.DISPATCHED ? -1 : 1;
        });

        return result;
    }
}

export class TripResourcesHandler {
    readonly item: TripsHandlerItem;

    constructor(item: TripsHandlerItem) {
        this.item = item;
    }

    /**
     * Returned structure is as below:
     * `{
     *      entityId: ...,
     *      entityType: ...,
     *      editable: true,
     *      removable: false,
     *      entity: ...
     * }`
     * 
     * If non-editable and non-removable: will be all disabled on UI.
     * If editable and non-removable: only `entityType` will be disabled on UI.
     * If editable and removable: none will be disabled and line will be possible to be removed.
     * @param {Vehicle[]} vehicles list of all applicable (of the specified type) vehicles
     * @param {Driver[]} drivers list of all active drivers
     */
    getInitResource(vehicles: Vehicle[], drivers: Driver[]): any[] {
        let result = [];
        let vehicleFound = false;
        let driverFound = false;
        if (!!this.item && !!this.item.trips && this.item.trips.length > 0) {
            this.item.trips[0].dispatches.forEach(dispatch => {
                let collection: Reportable[] = (dispatch.resource.entityType === ResourceType.DRIVER) ? drivers : vehicles;
                let reportable: Reportable = collection.find(function (next) {
                    return next.id === dispatch.resource.entityId;
                });
                if (!!reportable) {
                    vehicleFound = vehicleFound || dispatch.resource.entityType === ResourceType.VEHICLE;
                    driverFound = driverFound || dispatch.resource.entityType === ResourceType.DRIVER;
                    result.push({
                        entityId: dispatch.resource.entityId,
                        entityType: dispatch.resource.entityType,
                        editable: false,
                        removable: false,
                        entity: reportable
                    });
                }
            });
        }

        if (!vehicleFound) {
            result.push({
                entityId: !!vehicles && vehicles.length > 0 && vehicles[0].id || "",
                entityType: ResourceType.VEHICLE,
                editable: true,
                removable: false,
                entity: !!vehicles && vehicles.length > 0 && vehicles[0] || null
            });
        }
        if (!driverFound) {
            result.push({
                entityId: !!drivers && drivers.length > 0 && drivers[0].id || "",
                entityType: ResourceType.DRIVER,
                editable: true,
                removable: false,
                entity: !!drivers && drivers.length > 0 && drivers[0] || null
            });
        }

        return result;
    }
}

export class LastTimeEntry {
    readonly id: string;
    readonly status: string;
    readonly vehicleId: string;
    @Type(() => Position)
    readonly lastPosition: Position;

    constructor() { }
}

export class Driver extends Reportable {
    readonly remoteId: string;
    readonly status: string;
    readonly firstName: string;
    readonly lastName: string;
    @Type(() => ConnectionBind)
    readonly connectionBindList: ConnectionBind[];
    @Type(() => ReportingProfileHistory)
    readonly reportingProfileHistory: ReportingProfileHistory[];
    @Type(() => LastTimeEntry)
    readonly lastTimeEntry: LastTimeEntry;

    readonly username: string;
    readonly newPassword: string;
    readonly canEdit: boolean;

    @Type(() => DispatchGroup)
    readonly dispatchGroup: DispatchGroup;
    @Type(() => Attribute)
    readonly editableAttributes: Attribute[]

    constructor() {
        super();
    }

    name(): string {
        let first: string = this.firstName || "";
        let last: string = this.lastName || "";
        return `${first} ${last}`;
    }

    isActive(): boolean {
        return Status.ACTIVE === this.status;
    }

    hasLastLogEntry(): boolean {
        let noEntry: boolean = !this.lastTimeEntry || !this.lastTimeEntry.id;
        return !noEntry;
    }
}

export class Message {
    readonly id: string;
    readonly status: string;
    readonly draft: boolean;
    readonly read: boolean;
    /**
     * `App\\Entity\\Driver` or `App\\Entity\\Company`
     */
    readonly sender: string;
    readonly senderId: string;
    /**
     * `App\\Entity\\Driver` or `App\\Entity\\Company`
     */
    readonly receiver: string;
    readonly receiverId: string;
    readonly subject: string;
    readonly body: string;
    acknowledged: boolean;
    archived: boolean;
    readonly createdAt: string;

    /**
     * Marks message as an acknowledged one (we don't have `GET /api/common/messages/{id}`).
     */
    markAcknowledged() {
        this.acknowledged = true;
    }
    /**
     * Marks message as an archived one (we don't have `GET /api/common/messages/{id}`).
     */
    markArchived() {
        this.archived = true;
    }
    /**
     * Marks message as an unarchived one (we don't have `GET /api/common/messages/{id}`).
     */
    markUnarchived() {
        this.archived = false;
    }

    toDriver(): boolean {
        return this.receiver === "App\\Entity\\Driver";
    }

    fromDriver(): boolean {
        return this.sender === "App\\Entity\\Driver";
    }

    getBodyTeaser() {
        if (!this.body) {
            return "";
        }
        let clearBody = this.body.replace(/<[^<>]+?>/gm, ' ').replace(/(\s{2}|\n)/gm, ' ');
        let teaserMaxLength = 40;
        return clearBody.length > teaserMaxLength ? clearBody.substring(0, teaserMaxLength) + '...' : clearBody;
    }

    getSubjectTeaser() {
        if (!this.subject) {
            return "";
        }
        let teaserMaxLength = 40;
        return this.subject.length > teaserMaxLength ? this.subject.substring(0, teaserMaxLength) + '...' : this.subject;
    }
}

export class LocationGroup {
    readonly id: string;
    readonly name: string;
    readonly allowEdit: boolean;
    readonly createdAt: string;
    readonly locationCount: number;

    constructor() {
    }

    isGlobal(): boolean {
        return !this.allowEdit;
    }
}

export class Vehicle extends Reportable {
    readonly remoteId: string;
    readonly status: string;
    readonly createdAt: string;
    readonly deletedAt: string;
    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;
    @Type(() => ReportingProfileHistory)
    readonly reportingProfileHistory: ReportingProfileHistory[];
    @Type(() => Position)
    readonly lastPosition: Position;
    @Type(() => Operation)
    readonly lastOperation: Operation;
    @Type(() => ConnectionBind)
    readonly connectionBindList: ConnectionBind[];
    readonly gpsDataQualityEnforcement: number;
    readonly validGpsQualityEnforcement: any;
    readonly autoFix: boolean;

    readonly dataError: boolean;
    readonly dataErrorAt: string;
    readonly dataErrorIgnoreEligible: boolean;
    @Type(() => DomicileLocation)
    readonly domicileLocation: DomicileLocation;
    @Type(() => InspectionConfig)
    readonly inspectionConfig: InspectionConfig;

    readonly year: number;
    readonly make: string;
    readonly model: string;
    readonly vin: string;
    readonly canEdit: boolean;

    @Type(() => VehicleType)
    readonly type: VehicleType;
    @Type(() => DispatchGroup)
    readonly dispatchGroup: DispatchGroup;
    @Type(() => Attribute)
    readonly editableAttributes: Attribute[]

    constructor() {
        super();
    }

    isActive(): boolean {
        return Status.ACTIVE === this.status;
    }

    hasLastPosition(): boolean {
        let noEntry: boolean = !this.lastPosition || !this.lastPosition.id;
        return !noEntry;
    }

    gpsEnforcement() {
        if (!this.validGpsQualityEnforcement) {
            return null;
        }
        let resultKey = Object.keys(this.validGpsQualityEnforcement).find(function (key) {
            return this.validGpsQualityEnforcement[key] === this.gpsDataQualityEnforcement;
        }.bind(this));
        return resultKey;
    }

    gpsEnforcementValues() {
        if (!this.validGpsQualityEnforcement) {
            return [];
        }

        let itself = this;
        let result = [];
        Object.keys(this.validGpsQualityEnforcement).forEach(function (key: string) {
            let value = itself.validGpsQualityEnforcement[key];
            result.push({ key: key, value: value });
        });
        return result;
    }

}

export class Question {
    readonly id: string;
    readonly text: string;
    readonly allowImage: boolean;
    readonly requireDescription: boolean;
    readonly status: boolean;
    readonly createdAt: string;

    @Type(() => InspectionConfig)
    readonly inspectionConfigs: InspectionConfig[];

    constructor() { }

    requireDescriptionLabel() {
        return this.requireDescription ? "YES" : "NO";
    }

    allowImageLabel() {
        return this.allowImage ? "YES" : "NO";
    }
}

export class ConfigQuestion {
    @Type(() => Question)
    readonly question: Question;

    constructor() { }
}

export class InspectionConfig {
    readonly id: string;
    readonly name: string;
    readonly editable: boolean;

    @Type(() => Company)
    readonly company: Company;
    @Type(() => ConfigQuestion)
    readonly questions: ConfigQuestion[];
    @Type(() => Vehicle)
    readonly vehicles: Vehicle[];

    constructor() { }

    nameMatches(term: string) {
        console.log(term);
        return !term || (!!this.name && this.name.toLowerCase().includes(term.toLowerCase()));
    }
}

export class OdometerAdjustment {
    readonly id: string;
    readonly vehicleId: string;
    readonly odometer: number;
    readonly offset: number;
    readonly datetime: string;
    readonly reason: string;

    constructor() { }
}

export class ReportingProfileHistory {
    readonly id: string;
    readonly startedAt: string;
    readonly endedAt: string;
    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;

    constructor() { }
}

export const MINIMUM_WAGE_PRODUCT_TYPE = "Minimum_Wage_Compliance";
export const MILEAGE_PRODUCT_TYPE = "Mileage_Compliance";

export class ReportType {
    readonly productType: string;
    readonly reportNames: string[];

    constructor(productType: string, reportNames: string[]) {
        this.productType = productType;
        this.reportNames = reportNames;
    }
}

export class ReportEntity {
    readonly belongsTo: string;
    readonly entityId: string;
    readonly entityType: string;
    readonly name: string;
    readonly status: string;

    constructor() { }
}

export class ReportingProfile extends Reportable {
    readonly name: string;
    readonly entityName: string;
    readonly entityIdentifier: string;
    readonly countVehicles: number;
    readonly countDevices: number;
    readonly countDrivers: number;
    readonly reportPeriodEnd: string;
    readonly reportTimeZone: string;
    readonly defaultProfile: boolean;
    readonly units: string;
    @Type(() => Subscription)
    readonly subscriptions: Subscription[];
    @Type(() => LocationGroup)
    readonly locationGroups: LocationGroup[];

    constructor() {
        super();
    }

    private getSubscription(productType: string): Subscription {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return null;
        }
        let result = this.subscriptions.find(function (subscription) {
            return subscription.active() && subscription.productType === productType;
        });
        return result;
    }

    getMinimumWageSubscription(): Subscription {
        return this.getSubscription(MINIMUM_WAGE_PRODUCT_TYPE);
    }

    getMileageSubscription(): Subscription {
        return this.getSubscription(MILEAGE_PRODUCT_TYPE);
    }

    activeSubscriptions(): Subscription[] {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return [];
        }
        return this.subscriptions.filter(
            subscription => subscription.active());
    }

    activeSubscriptionsOf(type: EntityType): Subscription[] {
        let activeSubscriptions = this.activeSubscriptions();
        return activeSubscriptions.filter(
            subscription => type === subscription.billingUnit);
    }

    getEstimationDate(): string {
        let activeSubscriptions: Subscription[] = this.activeSubscriptions();
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
            return null;
        }
        let pickOneWithDate = activeSubscriptions.find(function (subscription: Subscription) {
            let createdAt = subscription.lastQuantity && subscription.lastQuantity.createdAt;
            return !!createdAt;
        });
        return pickOneWithDate.lastQuantity.createdAt;
    }

    activeSubscriptionTypes(): string[] {
        return this.activeSubscriptions().map(function (next: Subscription) {
            return next.productType;
        })
    }

    hasActiveSubscription(): boolean {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return false;
        }
        let result = this.subscriptions.find(function (subscription) {
            return subscription.active();
        });
        return !!result;
    }

    totalAmount(): number {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return 0;
        }
        let result = 0;
        this.subscriptions.forEach(function (subscription) {
            let totalAmount = 0;
            if (subscription && subscription.active() && subscription.lastQuantity) {
                totalAmount = subscription.lastQuantity.totalAmount();
            }
            result += totalAmount;
        });
        return result;
    }
}

export class Report {
    readonly reportName: string;
    readonly productType: string;
    @Type(() => ReportLinks)
    readonly links: ReportLinks;
    @Type(() => ReportPeriod)
    readonly reportPeriod: ReportPeriod;

    constructor() { }
}

export class ReportLinks {
    readonly JSON: string;
    readonly PDF: string;
    readonly EXCEL: string;
    readonly ARCHIVE: string;

    constructor() { }
}

export class ReportPeriod {
    readonly startedAt: string;
    readonly endedAt: string;
    readonly complete: boolean;

    constructor() { }
}

export class Subscription {
    readonly id: string;
    readonly productType: string;
    readonly unsubscribedAt: string;
    readonly billingUnit: string;
    @Type(() => QuantityEstimation)
    readonly lastQuantity: QuantityEstimation;
    readonly settings: any;

    constructor() { }

    active(): boolean {
        return !this.unsubscribedAt;
    }
}

export class QuantityEstimation {
    readonly id: string;
    readonly quantity: number;
    readonly amount: number;
    readonly createdAt: string;

    constructor() { }

    totalAmount() {
        if (!this.quantity || !this.amount) {
            return 0;
        }
        return this.quantity * this.amount;
    }
}

export class Connection {
    readonly id;
    readonly name: string;
    readonly type: string;
    readonly enabled: boolean;
    readonly auth: Auth;
    readonly error: boolean;

    constructor() { }

    status(): string {
        return this.enabled ? "(enabled)" : "(disabled)";
    }
}

export class ConnectionType {
    readonly type: string;
    readonly description: string;
    readonly auth: string[];

    constructor() { }

    initAuth(): any {
        if (!this.auth || this.auth.length === 0) {
            return {};
        }
        let result = {};
        this.auth.forEach(function (field) {
            result[field] = "";
        });
        return result;
    }
}

export class LocalTime {
    readonly timezone: string;
    readonly UTCOffset: number;
    readonly localTime: string;
    readonly timezoneAbbreviation: string;

    constructor() { }
}

export class Auth {
    readonly companyId: string;
    readonly username: string;
    readonly password: string;

    constructor() { }
}

export class Operation {
    readonly id: string;
    readonly entityId: string;
    readonly operation: string;
    readonly finishedAt: string;
    readonly durationSeconds: number;
    readonly error: boolean;
    readonly errorReason: string;
    readonly errorMessage: string;

    constructor() { }

    status(): string {
        return this.error ? this.errorReason : "Success";
    }
}

export class ConnectionBind {
    readonly id: string;
    readonly remoteId: string;
    @Type(() => Connection)
    readonly connection: Connection;
    readonly lastSyncAt: string;
    @Type(() => Operation)
    readonly lastOperation: Operation;

    constructor() { }
}

export class Notification {
    readonly id: string;
    readonly notificationType: string;
    readonly acknowledgeable: boolean;
    readonly entityType: string;
    readonly entityId: string;

    readonly text: string;
    readonly createdAt: string;

    constructor() { }
}

export class SupportedEntity {
    readonly entityId: string;
    readonly entityType: string;
    readonly name: string;

    constructor() { }

    normalizeEntityType() {
        return this.entityType && this.entityType.split("\\").pop();
    }
}

export class NotificationType {
    readonly notificationType: string;

    @Type(() => SupportedEntity)
    readonly supportedEntities: SupportedEntity[];
    readonly supportedAttributes: string[];
    /**
     * Array of supported communications.
     * Example values: `Text_Message`, `Email`, `In_App`
     */
    readonly supportedCommunications: string[];

    constructor() { }
}

export class NotificationSettingsAttributes {
    readonly name: string;
    readonly value: string;

    constructor() { }
}

export class NotificationSettings {
    readonly id: string;
    readonly notificationType: string;

    readonly entity: any;
    readonly entityId: string;
    /**
     * Server-side entity type in the form `App\\Entity\\Company`.
     */
    readonly entityType: string;

    readonly communicationType: string;
    @Type(() => NotificationSettingsAttributes)
    attributes: NotificationSettingsAttributes[];
    readonly createdAt: string;

    constructor() { }

    joinAttributes() {
        return this.attributes
            .map(attr => attr.value)
            .join(", ");
    }

    /**
     * Generic method to return entity name, i.e. for:
     *   1. `Company` - it will be `company.name`.
     *   2. `Connection` - it will be `connection.name`.
     *   3. `ReportingProfile` - it will be `company.name`.
     *   4. `Vehicle` - it will be `company.remoteId`.
     *   5. `Driver` - it will be `driver.firstName + ' ' + driver.lastName`.
     */
    getEntityName() {
        function getDriverName(entity: any) {
            if (!entity.firstName && !entity.lastName) {
                return null;
            }
            let first: string = entity.firstName || "";
            let last: string = entity.lastName || "";
            return `${first} ${last}`;
        }

        return this.entity && (this.entity.name || getDriverName(this.entity) || this.entity.remoteId || "");
    }
}

export class NotificationSettingsList {
    readonly list: NotificationSettings[];

    constructor(list: NotificationSettings[]) {
        this.list = list;
        // Lets sort createdAt.ASC
        this.list.sort((a, b) => {
            if (a.createdAt < b.createdAt)
                return -1;
            if (a.createdAt > b.createdAt)
                return 1;
            return 0;
        });;
    }

    /**
     * Prepares UI hierarchy of the next format:
     * [
     *   {
     *     "notificationType": "Invoice_Paid",
     *     "typeMap": [
     *       {
     *         "entityName": "Company Name",
     *         "entityType": "App\Entity\Company",
     *         "entityId": "11111111-2222-3333-4444-555555555555",
     *         "settings": [...]
     *       },
     *       ...
     *     ]
     *   },
     *   ...
     * ]
     */
    prepareUIHierarchy(nsTypes: NotificationType[]) {
        var groupBy = function (xarray, key) {
            return xarray.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        this.list.forEach(function (ns: NotificationSettings) {
            // Lets reorder `ns.attributes` based on the type description
            let theType = nsTypes.find(function (next) {
                return ns.notificationType === next.notificationType;
            });
            let orderedAttributes = [];
            if (theType.supportedAttributes && theType.supportedAttributes.length > 0) {
                theType.supportedAttributes.forEach(function (name) {
                    let theAttribute = ns.attributes.find(function (next) {
                        return next.name === name;
                    });
                    orderedAttributes.push(theAttribute);
                });
            }
            ns.attributes = orderedAttributes;
        });

        let groupedByType = groupBy(this.list, 'notificationType');
        let result = [];
        // result will have order same to the `nsTypes` in terms of `notificationType`
        nsTypes.forEach(function (type) {
            const notificationType = type.notificationType;
            let ofType = groupedByType[notificationType];

            if (ofType && ofType.length > 0) {
                let entityMapList = [];
                let groupedByEntitiId = groupBy(ofType, 'entityId');
                // Prepare intermidiate map for each entity
                Object.keys(groupedByEntitiId).forEach(entitiId => {
                    let settings = groupedByEntitiId[entitiId];
                    let entityMap = {
                        entityName: settings[0].getEntityName(),
                        entityType: settings[0].entityType,
                        entityId: settings[0].entityId,
                        settings: settings
                    };

                    entityMapList.push(entityMap);
                })
                result.push({
                    notificationType: notificationType,
                    typeMap: entityMapList
                });
            }
        });
        return result;
    }
}

export class SearchResult {
    readonly entityType: string;
    readonly entityId: string;
    readonly search: string;
    readonly status: string;
    readonly companyId: string;

    constructor() { }
}

export class PageResult<T> {

    @Exclude()
    private type: Function;

    @Type(options => {
        return (options.newObject as PageResult<T>).type;
    })
    results: T[];

    resultCount: number;

    constructor(type: Function) {
        this.type = type;
    }
}

export class FilterParams {
    readonly page: number;
    readonly sort: string;

    constructor(page: number, sort: string) {
        this.page = page;
        this.sort = sort;
    }
}
