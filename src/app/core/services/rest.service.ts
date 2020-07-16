import { TOKEN_INTERCEPTOR_HEADER, MAPBOX_API_URL, MAPBOX_ACCESS_TOKEN, MESSAGES_PAGESIZE } from '@app/core/smartadmin.config';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";

import { environment } from '@env/environment';
import { Observable, throwError, of, ObservableInput, forkJoin } from "rxjs";
import { map, catchError } from 'rxjs/operators';
import { plainToClass, plainToClassFromExist } from "class-transformer";
import { NotificationService } from './notification.service';
import {
  User, Product, PageResult, FilterParams, Driver, ReportingProfile, Connection, Company, Dictionary,
  Operation, ConnectionType, Invoice, Subscription, SearchResult, Report, LocalTime, Vehicle, ProductEstimation,
  Notification, NotificationType, NotificationSettingsList, NotificationSettings, LocationGroup, OdometerAdjustment,
  DomicileLocation, AuthInfo, MapboxPlace, LocationWrapper, PositionsData, Position, Statistics, Message, Device,
  ReportType, ReportEntity, Attribute, FuelTransaction, FuelStatistics, DispatchGroup, VehicleType, Discount, Customer,
  Booking, FeedbackType, DwellEvent, DwellStat, BookingStatus, Stop, Trip, TripsHandler, Status, TripChangeLog,
  InspectionConfig, Question, ConfigQuestion, DeviceProfile
} from './rest.model';

const API_URL = environment.apiBaseUrl;

function tokenIntercepted(headers?: HttpHeaders): HttpHeaders {
  let result = !headers ? new HttpHeaders().append(TOKEN_INTERCEPTOR_HEADER, 'true') : headers.append(TOKEN_INTERCEPTOR_HEADER, 'true');
  return result;
}
function ignoreLoadingBar(headers?: HttpHeaders): HttpHeaders {
  let result = !headers ? new HttpHeaders().append('ignoreLoadingBar', 'true') : headers.append('ignoreLoadingBar', 'true');
  return result;
}

const httpHeaders = new HttpHeaders({
  'Content-Type': 'application/json'
});
const authOptions = { headers: ignoreLoadingBar(httpHeaders) };
const authOptionsTokenized = { headers: tokenIntercepted(ignoreLoadingBar(httpHeaders)) };
const httpInterceptedOptions = { headers: tokenIntercepted(httpHeaders) };
const getHttpInterceptedOptions = { headers: tokenIntercepted() };

const exposedHttpHeaders = new HttpHeaders({
  // 'Access-Control-Request-Headers': 'Content-Disposition'
});
const getReportOptions = { headers: tokenIntercepted(exposedHttpHeaders), observe: 'response' as 'response', responseType: 'blob' as 'blob' };

@Injectable()
export class LocalStorageService {

  constructor() { }

  public storeSearch(query: string) {
    localStorage.setItem("search-query", query || "");
  }

  public getSearch(): string {
    return localStorage.getItem("search-query") || "";
  }

  public storeApiKey(key: string) {
    localStorage.setItem("apiKey", key || "");
  }

  public getApiKey(): string {
    return localStorage.getItem("apiKey") || "";
  }

  public clearApiKey(): void {
    localStorage.removeItem("apiKey");
    localStorage.removeItem("loginAs.user");
    localStorage.removeItem("loginAs.company");
  }

  /**
   * Stores user info to impersonate/imitate as a logged in one.
   */
  public storeLoginAsInfo(loginAs: any, company: any) {
    localStorage.setItem("loginAs.user", JSON.stringify(loginAs) || "");
    localStorage.setItem("loginAs.company", JSON.stringify(company) || "");
  }

  public getLoginAs(): User {
    let loginAs = localStorage.getItem("loginAs.user");
    return loginAs ? plainToClass(User, JSON.parse(loginAs) as User) : null;
  }
  public getCompany(): Company {
    let company = localStorage.getItem("loginAs.company");
    return company ? plainToClass(Company, JSON.parse(company) as Company) : null;
  }

  public clearLoginAsInfo(): void {
    localStorage.removeItem("loginAs.user");
    localStorage.removeItem("loginAs.company");
  }

  public clearLocalStorageBy(prefix: string) {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      let nextKey: string = localStorage.key(i);
      if (nextKey.indexOf(prefix) !== -1) {
        keysToRemove = [...keysToRemove, nextKey];
      }
    }

    for (var i = 0; i < keysToRemove.length; i++) {
      localStorage.removeItem(keysToRemove[i]);
    }
  }
}

@Injectable()
export class RestService {

  constructor(private http: HttpClient,
    private notificationService: NotificationService) { }

  private handleAttachment(response: any) {
    function getFilename(disposition: string) {
      if (disposition && disposition.indexOf('attachment') !== -1) {
        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        var matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          let filename = matches[1].replace(/['"]/g, '');
          return filename;
        }
      }
      return null;
    }

    let dataType = response.type;
    let binaryData = [];
    binaryData.push(response.body);
    let downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: dataType }));
    let disposition = response.headers.get("Content-Disposition");
    let filename = getFilename(disposition);
    let theName = filename || "report";
    downloadLink.setAttribute('download', theName);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.parentNode.removeChild(downloadLink);
  }

  public doReportDownload(uri: string, filename: string) {
    let theUri = (uri.indexOf("/") === 0 && API_URL.lastIndexOf("/") === API_URL.length - 1) ? uri.replace("/", "") : uri;
    this.http.get(API_URL + theUri, getReportOptions)
      .subscribe((response: any) => this.handleAttachment(response))
  }

  public doLogin(email: string, password: string): Observable<AuthInfo> {
    const body = {
      username: email,
      password: password
    }

    return this.http.post<AuthInfo>(API_URL + "api/web/auth", body, authOptions)
      .pipe(
        map(data => {
          return plainToClass(AuthInfo, data);
        }),
        catchError(this.handleLoginError)
      );
  }

  public doLogout() {
    this.http.get<any>(API_URL + 'api/web/logout', authOptionsTokenized)
      .pipe(
        map(data => { return true }),
        catchError(function () {
          return of(false);
        })
      ).subscribe(result => {
        let message = `Logged out: ${result}`;
        console.log(message);
      });
  }

  public doForgotPassword(email: string): Observable<boolean> {
    const body = {
      email: email
    }

    return this.http.post<boolean>(API_URL + "api/web/public/security/forgotpassword", body, authOptionsTokenized)
      .pipe(
        map(data => { return true }),
        catchError(function () {
          return of(false);
        })
      );
  }

  public doResetPassword(email: string, newPassword: string, hash: string): Observable<boolean> {
    const body = {
      email: email,
      key: hash,
      password: newPassword
    }

    return this.http.post<boolean>(API_URL + "api/web/public/security/resetpassword", body, authOptionsTokenized)
      .pipe(
        map(data => { return true }),
        catchError(function () {
          return of(false);
        })
      );
  }

  public secureResetPassword(passwordData: any): Observable<boolean> {
    return this.http
      .patch<boolean>(API_URL + `api/web/secureresetpassword`, passwordData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Preferences</b>: Password changed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Booking` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `bookNo.DESC` or  `billingName.ASC`
   * @param {string} status `status` field filtering, might be one of: `all`, `completed`, `dispatched`, `available`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Booking>>} An `Observable` of the paginated result of `Booking`s
   * @memberof RestService
   */
  public getAllBookings(params: FilterParams, status: string, limit: number = 10): Observable<PageResult<Booking>> {
    let uri = status === BookingStatus.ALL
      ? `api/web/dispatching/bookings`
      : `api/web/dispatching/bookings/${status}`;
    return this.http
      .get<PageResult<Booking>>(API_URL + `${uri}?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Booking>(Booking), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches up to 1000 `Booking` instances to handle the pagination logic on the UI side.
   * 
   * @param {string} status `status` field filtering, might be one of: `all`, `completed`, `dispatched`, `available`
   * @returns {Observable<Booking[]>} An `Observable` of the `Booking`s array
   * @memberof RestService
   */
  public get1000Bookings(status: string): Observable<Booking[]> {
    let params: FilterParams = new FilterParams(1, `createdAt.DESC`);
    return this.getAllBookings(params, status, 1000).pipe(
      map(
        pageResult => pageResult.results
      )
    )
  }

  public getAllBookingsFor(customerId: string, params: FilterParams, status: string = null, limit: number = 10): Observable<PageResult<Booking>> {
    let uri = status === BookingStatus.ALL
      ? `api/web/customers/${customerId}/bookings`
      : `api/web/customers/${customerId}/bookings/${status}`;
    return this.http
      .get<PageResult<Booking>>(API_URL + `${uri}?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Booking>(Booking), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getBooking(id: string): Observable<Booking> {
    return this.http
      .get<Booking>(API_URL + `api/web/dispatching/bookings/details/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Booking, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateBooking(id: string, data: any): Observable<Booking> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Booking>(API_URL + `api/web/dispatching/bookings/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Booking</b>: Updated successfully");
          return plainToClass(Booking, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createBooking(data: any): Observable<Booking> {
    return this.http
      .post<Booking>(API_URL + "api/web/dispatching/bookings", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Booking</b>: Created successfully");
          return plainToClass(Booking, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createStop(bookingId: string, data: any): Observable<Stop> {
    let body = {
      "booking": {
        "id": bookingId
      },
      "stop": data
    }

    return this.http
      .post<Stop>(API_URL + "api/web/dispatching/stops", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Stop</b>: Created successfully");
          return plainToClass(Stop, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 1000 `Trip` instances to handle the pagination logic on the UI side.
   * 
   * @param {string} statuses `status` field filtering, might be either `PREASSIGNED`, 'DISPATCHED', `ON HOLD`, `APPROVED` or `COMPLETE`
   * @returns {Observable<TripsHandler>} An `Observable` of the `TripsHandler`
   * @memberof RestService
   */
  public get1000Trips(statuses: string[], dispatchGroupId?: number): Observable<TripsHandler> {
    statuses = !!statuses ? statuses : [];
    let statusesParam: string = statuses.map(status => `statuses[]=${status}`).join('&');
    if (dispatchGroupId) {
      statusesParam = statusesParam + (statusesParam ? '&' : '') + `dispatchGroupId=${dispatchGroupId}`;
    }
    return this.http
      .get<TripsHandler>(API_URL + `api/web/dispatching/trips?limit=1000&page=1&sort=createdAt.DESC&${statusesParam}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Trip> = plainToClassFromExist(new PageResult<Trip>(Trip), response);
          return new TripsHandler(pageResult.results);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000TripChangeLogs(tripId: string): Observable<TripChangeLog[]> {
    return this.http
      .get<TripChangeLog[]>(API_URL + `api/web/dispatching/trips/${tripId}/change-history?limit=1000&page=1&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<TripChangeLog> = plainToClassFromExist(new PageResult<TripChangeLog>(TripChangeLog), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteTrip(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/dispatching/trips/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Trip</b>: Trip unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createTrip(data: any): Observable<Trip> {
    return this.http
      .post<Trip>(API_URL + "api/web/dispatching/trips", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Trip</b>: Created successfully");
          return plainToClass(Trip, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `remoteId.DESC` or  `firstName.ASC`
   * @param {string} status `status` field filtering, might be either `(active)` or `(deleted)`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Driver>>} An `Observable` of the paginated result of `Driver`s
   * @memberof RestService
   */
  public getAllDrivers(params: FilterParams, status: string, limit: number = 10): Observable<PageResult<Driver>> {
    return this.http
      .get<PageResult<Driver>>(API_URL + `api/web/drivers?status=${status}&limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Driver>(Driver), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `remoteId.ASC` logic, which is utilized in the `DispatchComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000Drivers(): Observable<Driver[]> {
    return this.get1000DriversBy();
  }

  public get1000ActiveDrivers(): Observable<Driver[]> {
    return this.get1000DriversBy(Status.ACTIVE);
  }

  public get1000DriversBy(status?: string): Observable<Driver[]> {
    let statusPart = !!status ? `&status=${status}` : '';
    return this.http
      .get<PageResult<Driver>>(API_URL + `api/web/drivers?limit=1000&sort=remoteId.ASC${statusPart}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Driver>(Driver), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDriver(id: string): Observable<Driver> {
    return this.http
      .get<Driver>(API_URL + `api/web/drivers/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateDriver(id: string, data: any): Observable<Driver> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Driver>(API_URL + "api/web/drivers", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Updated successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateDriverAttributes(entityId: string, attributes: any): Observable<boolean> {
    return this.updateEditableAttributes(entityId, "Driver", attributes);
  }
  public updateVehicleAttributes(entityId: string, attributes: any): Observable<boolean> {
    return this.updateEditableAttributes(entityId, "Vehicle", attributes);
  }
  private updateEditableAttributes(entityId: string, entityType: string, attributes: any): Observable<boolean> {
    let body = {
      "attributes": attributes,
      "entityId": entityId,
      "entityType": entityType
    };
    return this.http
      .patch<Driver>(API_URL + "api/web/editable-attributes", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createDriver(data: any): Observable<Driver> {
    return this.http
      .post<Driver>(API_URL + "api/web/drivers", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Created successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDriverToReportingProfile(driverId: string, assignData: any): Observable<Driver> {
    return this.http
      .patch<Driver>(API_URL + `api/web/drivers/${driverId}/assigntoreportingprofile`, assignData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Assigned successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleStatus(driverId: string): Observable<Driver> {
    return this.http
      .patch<Driver>(API_URL + `api/web/drivers/${driverId}/togglestatus`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Status changed successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 25 `Message` instances.
   * 
   * @param {string} folder folder to fetch messages for
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `createdAt.DESC` or  `receiverId.ASC`
   * @param {string} query search query
   * @param {string} driverId driver based filtering
   * @returns {Observable<PageResult<Message>>} An `Observable` of the paginated result of `Message`s
   * @memberof RestService
   */
  public getMessages(folder: string, params: FilterParams, query: string, driverId: string): Observable<PageResult<Message>> {
    let searchParams = !!query ? `&search=${query}` : "";
    let driverParams = !!driverId ? `&driverId=${driverId}` : "";

    return this.http
      .get<PageResult<Message>>(API_URL + `api/common/messages/${folder}?limit=${MESSAGES_PAGESIZE}&page=${params.page}&sort=${params.sort}${searchParams}${driverParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Message>(Message), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getInboxMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("inbox", params, query, driverId);
  }
  public getSentMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("sent", params, query, driverId);
  }
  public getDraftMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("drafts", params, query, driverId);
  }
  public getArchivedMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("archived", params, query, driverId);
  }

  public searchMessages(query: string, params: FilterParams): Observable<PageResult<Message>> {
    return this.http
      .get<PageResult<Message>>(API_URL + `api/common/messages/search/${query}?limit=25&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Message>(Message), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public multipleMessageAction(action: string, ids: string[]): Observable<boolean> {
    let input = new FormData();
    ids.forEach(id => {
      input.append('ids[]', id);
    });

    return this.http
      .post<boolean>(API_URL + `api/common/messages/${action}/multiple`, input, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess(`<b>Message</b>: Messages marked as ${action}`);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public archiveMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("archive", ids);
  }
  public unarchiveMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("unarchive", ids);
  }
  public readMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("read", ids);
  }
  public unreadMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("unread", ids);
  }

  public acknowledgeMessage(id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/common/messages/${id}/acknowledge`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Message</b>: Message acknowledged successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public readMessage(id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/common/messages/${id}/read`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          console.log(`Message [${id}] marked read`);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createMessage(data: any): Observable<Message> {
    let isDraft = data.draft || false;
    let body = {
      draft: isDraft,
      receiver: "App\\Entity\\Driver",
      subject: data.subject,
      body: data.body,
    };
    if (!!data.id) {
      body["id"] = data.id;
    }
    if (!!data.receiverId) {
      body["receiverId"] = data.receiverId;
    }
    if (!!data.reMessageId) {
      body["reMessageId"] = data.reMessageId;
    }

    return this.http
      .post<Message>(API_URL + "api/common/messages", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let message = isDraft
            ? "<b>Message</b>: Message saved as draft successfully"
            : "<b>Message</b>: Message sent successfully";
          this.notifySuccess(message);
          return plainToClass(Message, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public sendMessage(message: Message): Observable<Message> {
    let data = {
      id: message.id,
      receiver: message.receiver,
      receiverId: message.receiverId,
      subject: message.subject,
      body: message.body,
      draft: false
    }

    return this.createMessage(data);
  }

  public get1000LocationGroups(): Observable<LocationGroup[]> {
    return this.http
      .get<PageResult<LocationGroup>>(API_URL + `api/web/locationgroups?limit=1000&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<LocationGroup>(LocationGroup), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteLocationGroup(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/locationgroups/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location Group</b>: Group deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createLocationGroup(data: any): Observable<LocationGroup> {
    return this.http
      .post<LocationGroup>(API_URL + "api/web/locationgroups", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location Group</b>: Group added successfully");
          return plainToClass(LocationGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignLocationGroupFrom(profileId: string, id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/reportingprofiles/${profileId}/locationgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Location Group unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignLocationGroupTo(profileId: string, id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/web/reportingprofiles/${profileId}/locationgroup/${id}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Location Group assigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getValidLocationsFor(profileId: string, query: string): Observable<DomicileLocation[]> {
    let searchURI = !!query ? `&search=${query}` : "";
    return this.http
      .get<DomicileLocation[]>(API_URL + `api/web/reportingprofiles/${profileId}/locations?limit=1000&page=1${searchURI}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getLocationsFor(groupId: string, page: number, perPage: number = 500): Observable<PageResult<DomicileLocation>> {
    return this.http
      .get<PageResult<DomicileLocation>>(API_URL + `api/web/locationgroups/${groupId}/locations?limit=${perPage}&page=${page}&sort=name.ASC&displayable=true`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `DomicileLocation` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `remoteId.DESC` or  `status.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<DomicileLocation>>} An `Observable` of the paginated result of `DomicileLocation`s
   * @memberof RestService
   */
  public getAllLocations(params: FilterParams, limit: number = 10): Observable<PageResult<DomicileLocation>> {
    return this.http
      .get<PageResult<DomicileLocation>>(API_URL + `api/web/locations?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Locations(): Observable<DomicileLocation[]> {
    return this.http
      .get<DomicileLocation[]>(API_URL + `api/web/locations?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getLocation(id: string): Observable<DomicileLocation> {
    return this.http
      .get<DomicileLocation>(API_URL + `api/web/locations/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public doMixedSearch(groupId: string, query: string): Observable<any[]> {
    if (!query) {
      return of([]);
    }

    let locations = this.http.get(API_URL + `api/web/locationgroups/${groupId}/locations?limit=10&page=1&search=${query}&displayable=true`, getHttpInterceptedOptions);
    let places = this.http.get(MAPBOX_API_URL + `geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US,CA,MX`, { headers: httpHeaders });
    return forkJoin([locations, places]).pipe(
      map(results => {
        let locations = plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), results[0]).results;
        let places = plainToClass(MapboxPlace, results[1]["features"]);
        let result = locations.map(l => new LocationWrapper(true, l)).slice(0, 10)
          .concat(
            places.map(p => new LocationWrapper(false, p))
          );
        return result;
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    );
  }

  public doMixedProfileSearch(profileId: string, query: string): Observable<any[]> {
    if (!query) {
      return of([]);
    }

    let searchURI = !!query ? `&search=${query}` : "";
    let locations = this.http.get(API_URL + `api/web/reportingprofiles/${profileId}/locations?limit=1000&page=1${searchURI}`, getHttpInterceptedOptions);
    let places = this.http.get(MAPBOX_API_URL + `geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US,CA,MX`, { headers: httpHeaders });
    return forkJoin([locations, places]).pipe(
      map(results => {
        let locations = plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), results[0]).results;
        let places = plainToClass(MapboxPlace, results[1]["features"]);
        let result = locations
          .filter( // Let's filter out 3-rd party integration locations here without lon/lat
            location => location.hasLonLat())
          .map(l => new LocationWrapper(true, l)).slice(0, 10)
          .concat(
            places.map(p => new LocationWrapper(false, p))
          );
        return result;
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    );
  }

  public createLocation(data: any): Observable<DomicileLocation> {
    return this.http
      .post<DomicileLocation>(API_URL + "api/web/locations", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Location added successfully");
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Updates `Location` based on the provided data.
   * It is a full update API call (missed ones will be handled as `null`), `polygon` and `locationGroupId` are required.
   */
  public updateLocation(locationData: any): Observable<DomicileLocation> {
    return this.http
      .patch<DomicileLocation>(API_URL + `api/web/locations`, locationData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Updated successfully");
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteLocation(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/locations/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Location deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of `DwellEvent` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `id.DESC` or  `startedAt.ASC`
   * @returns {Observable<PageResult<DwellEvent>>} An `Observable` of the paginated result of `DwellEvent`s
   * @memberof RestService
   */
  private getDwellEvents(uri: string, params: FilterParams): Observable<PageResult<DwellEvent>> {
    return this.http
      .get<PageResult<DwellEvent>>(API_URL + `${uri}?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DwellEvent>(DwellEvent), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDwellEventsForVehicle(vehicleId: string, params: FilterParams): Observable<PageResult<DwellEvent>> {
    let uri = `api/web/vehicles/${vehicleId}/dwellevents`;
    return this.getDwellEvents(uri, params);
  }

  public getDwellEventsForLocation(locationId: string, params: FilterParams): Observable<PageResult<DwellEvent>> {
    let uri = `api/web/locations/${locationId}/dwellevents`;
    return this.getDwellEvents(uri, params);
  }

  /**
   * Fetches artray of `DwellStat` instances.
   * 
   * @returns {Observable<DwellStat[]>} An `Observable` of the array of `DwellStat`s
   * @memberof RestService
   */
  public getDwellStatsFor(locationId: string, startDate: string, endDate: string): Observable<DwellStat[]> {
    return this.http
      .get<DwellStat[]>(API_URL + `api/web/locations/${locationId}/dwellstats?startDate=${startDate}&endDate=${endDate}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(DwellStat, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getPositionsFor(vehicleId: string, hopToErrors: boolean, endDatetime: string, page: number, perPage: string): Observable<PositionsData> {
    let additionalParams = hopToErrors ? `hopToErrors=true` : `endDatetime=${endDatetime}`;
    return this.http
      .get<PositionsData>(API_URL + `api/web/positions?limit=${perPage}&page=${page}&vehicleId=${vehicleId}&${additionalParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(PositionsData, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Creates `Position` for the specified vehicle based on the provided `data` (should contain
   * `datetime` and `locationId`).
   */
  public createPositionFor(vehicleId: string, data: any): Observable<Position> {
    let body = {
      vehicleId: vehicleId,
      ...data
    }
    return this.http
      .post<Position>(API_URL + "api/web/positions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Position</b>: Position added successfully");
          return plainToClass(Position, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Creates many `Position`s based on the provided `data`, which contains `createPositionRequests` array of position
   * datas to create, each entry should contain `vehicleid`, `datetime` and `locationId` (optionally `lan` and `lat`).
   */
  public createManyPositions(data: any): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + "api/web/positions/many", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Position</b>: Position(s) added successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Updates `Position`s list defined by `positionIds` array for the specified vehicle based on
   * the provided `data` (contains `action` and/or `assignToVehicleId`).
   */
  public updatePositionsFor(vehicleId: string, positionIds: string[], data: any): Observable<any> {
    let body = {
      vehicleId: vehicleId,
      positionIds: positionIds,
      ...data
    }
    return this.http
      .patch<any>(API_URL + "api/web/positions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Position</b>: Positions updated successfully");
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getVehiclesToAssignFor(vehicleId: string, positionIds: string[]): Observable<Vehicle> {
    let body = {
      vehicleId: vehicleId,
      action: "Reassign",
      positionIds: positionIds
    }
    return this.http
      .post<Vehicle>(API_URL + "api/web/positions/canassigntovehicles", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Vehicle` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `remoteId.DESC` or  `status.ASC`
   * @param {string} status `status` field filtering, might be either `(active)` or `(deleted)`
   * @param {boolean} dataError `dataError` field filtering, if specified `status` filtering will be ignored
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Vehicle>>} An `Observable` of the paginated result of `Vehicle`s
   * @memberof RestService
   */
  public getAllVehicles(params: FilterParams, status: string, dataError: boolean, limit: number = 10): Observable<PageResult<Vehicle>> {
    let filtering = `dataError=1&`; // in case dataError ones are needed
    if (!dataError) {
      filtering = `status=${status}&`;
    }
    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/vehicles?${filtering}limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `remoteId.ASC` logic, which is utilized in the `DispatchComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000Vehicles(): Observable<Vehicle[]> {
    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/vehicles?limit=1000&sort=remoteId.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getVehicle(id: string): Observable<Vehicle> {
    return this.http
      .get<Vehicle>(API_URL + `api/web/vehicles/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public ignoreVehicleErrors(id: string): Observable<boolean> {
    return this.http
      .put<boolean>(API_URL + `api/web/vehicles/${id}/ignoreerror`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Errors ignored");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateVehicle(id: string, data: any): Observable<Vehicle> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Vehicle>(API_URL + "api/web/vehicles", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Updated successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createVehicle(data: any): Observable<Vehicle> {
    return this.http
      .post<Vehicle>(API_URL + "api/web/vehicles", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Created successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignVehicleToReportingProfile(vehicleId: string, assignData: any): Observable<Vehicle> {
    return this.http
      .patch<Vehicle>(API_URL + `api/web/vehicles/${vehicleId}/assigntoreportingprofile`, assignData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleVehicleStatus(vehicleId: string): Observable<Vehicle> {
    return this.http
      .patch<Vehicle>(API_URL + `api/web/vehicles/${vehicleId}/togglestatus`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Status changed successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDomicile(vehicleId: string, locationId: string): Observable<Vehicle> {
    return this.http
      .patch<Vehicle>(API_URL + `api/web/vehicles/${vehicleId}/assigndomicile/${locationId}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Domicile assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `InspectionConfig` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or  `id.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<InspectionConfig>>} An `Observable` of the paginated result of `InspectionConfig`s
   * @memberof RestService
   */
  public getAllInspectionConfigs(params: FilterParams, limit: number = 10): Observable<PageResult<InspectionConfig>> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<InspectionConfig>(InspectionConfig), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `name.ASC` logic, which is utilized in the `VehicleViewComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000InspectionConfigs(): Observable<InspectionConfig[]> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<InspectionConfig>(InspectionConfig), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000InspectionConfigsLight(): Observable<InspectionConfig[]> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig/light?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<InspectionConfig>(InspectionConfig), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getInspectionConfig(id: string): Observable<InspectionConfig> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(InspectionConfig, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateInspectionConfig(id: string, data: any): Observable<InspectionConfig> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<InspectionConfig>(API_URL + "api/web/inspectionconfig", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Updated successfully");
          return plainToClass(InspectionConfig, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createInspectionConfig(data: any): Observable<InspectionConfig> {
    return this.http
      .post<InspectionConfig>(API_URL + "api/web/inspectionconfig", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Created successfully");
          return plainToClass(InspectionConfig, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignInspectionConfigToVehicle(vehicleId: string, id: string): Observable<Vehicle> {
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/vehicles/${vehicleId}/inspectionconfig/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Inspection Configuration assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignInspectionConfigFromVehicle(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/vehicles/${vehicleId}/inspectionconfig/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Inspection Configuration unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Question` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `text.DESC` or  `createdAt.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Question>>} An `Observable` of the paginated result of `Question`s
   * @memberof RestService
   */
  public getAllQuestions(params: FilterParams, limit: number = 10): Observable<PageResult<Question>> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Question>(Question), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `text.ASC` logic, which is utilized in the `ConfigurationViewComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000Questions(): Observable<Question[]> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=1000&sort=text.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Question>(Question), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllQuestionsFor(configuration: InspectionConfig, params: FilterParams, limit: number = 10): Observable<PageResult<Question>> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=1000&page=1&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          configuration
          let paginated = plainToClassFromExist(new PageResult<Question>(Question), response);
          let anyQuestion = !!configuration.questions && configuration.questions.length > 0;
          if (!anyQuestion) {
            return paginated;
          }

          let excludeIds = configuration.questions.map(function (next: ConfigQuestion) {
            return next.question.id;
          });
          let questions = (paginated && paginated.results) || [];
          let filteredQuestions = questions.filter(
            (question: Question) => !excludeIds.includes(question.id)
          );

          let begin = (params.page - 1) * limit;
          let end = params.page * limit - 1;
          let body = {
            "results": filteredQuestions.splice(begin, end),
            "resultCount": filteredQuestions.length
          }
          return plainToClassFromExist(new PageResult<Question>(Question), body);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000QuestionsFor(configuration: InspectionConfig): Observable<Question[]> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=1000&page=1&sort=text.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          configuration
          let paginated = plainToClassFromExist(new PageResult<Question>(Question), response);
          let questions = (paginated && paginated.results) || [];

          let anyQuestion = !!configuration.questions && configuration.questions.length > 0;
          if (!anyQuestion) {
            return questions;
          }

          let excludeIds = configuration.questions.map(function (next: ConfigQuestion) {
            return next.question.id;
          });
          let filteredQuestions = questions.filter(
            (question: Question) => !excludeIds.includes(question.id)
          );
          return filteredQuestions;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createQuestion(data: any): Observable<Question> {
    let body = {
      ...data,
      "status": true
    }
    return this.http
      .post<Question>(API_URL + "api/web/questions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Question</b>: Created successfully");
          return plainToClass(Question, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateQuestion(id: string, data: any): Observable<Question> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Question>(API_URL + "api/web/questions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Question</b>: Updated successfully");
          return plainToClass(Question, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignQuestionToInspectionConfig(configId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("LINK", API_URL + `api/web/inspectionconfig/${configId}/question/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Question assigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignQuestionFromInspectionConfig(configId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/inspectionconfig/${configId}/question/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Question unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `OdometerAdjustment` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `datetime.DESC` or  `reason.ASC`
   * @returns {Observable<PageResult<OdometerAdjustment>>} An `Observable` of the paginated result of `OdometerAdjustment`s
   * @memberof RestService
   */
  public getAllOdometerAdjustments(vehicleId: string, params: FilterParams): Observable<PageResult<OdometerAdjustment>> {
    return this.http
      .get<PageResult<OdometerAdjustment>>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<OdometerAdjustment>(OdometerAdjustment), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches valid datetimes for the specified `day` and `vehicleId`.
   *
   * @param {string} vehicleId Vehicle's ID
   * @param {string} day Date in the format `yyyy-MM-dd`
   * @memberof RestService
   */
  public getOdometerAdjustmentsDatetimesFor(vehicleId: string, day: string): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments/datetimes/${day}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createOdometerAdjustment(vehicleId: string, data: any): Observable<OdometerAdjustment> {
    return this.http
      .post<OdometerAdjustment>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Odometer Adjustment</b>: Created successfully");
          return plainToClass(OdometerAdjustment, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteOdometerAdjustment(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Odometer Adjustment</b>: Entry removed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllReportingProfiles(params: FilterParams, limit: number = 10): Observable<PageResult<ReportingProfile>> {
    return this.http
      .get<PageResult<ReportingProfile>>(API_URL + `api/web/reportingprofiles?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<ReportingProfile>(ReportingProfile), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000ReportingProfiles(): Observable<ReportingProfile[]> {
    return this.http
      .get<PageResult<ReportingProfile>>(API_URL + `api/web/reportingprofiles?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<ReportingProfile>(ReportingProfile), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000ReportingProfileLights(): Observable<ReportingProfile[]> {
    return this.http
      .get<PageResult<ReportingProfile>>(API_URL + `api/web/reportingprofiles/light?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<ReportingProfile>(ReportingProfile), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getProductsFor(reportingProfileId: string): Observable<ProductEstimation[]> {
    return this.http
      .get<ProductEstimation[]>(API_URL + `api/web/products/${reportingProfileId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(ProductEstimation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReportingProfile(id: string): Observable<ReportingProfile> {
    return this.http
      .get<ReportingProfile>(API_URL + `api/web/reportingprofiles/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(ReportingProfile, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteSubscription(reportingProfileId: string, subscriptionId: string): Observable<boolean> {
    let httpOptions = getHttpInterceptedOptions;
    httpOptions["body"] = {
      subscriptionId: subscriptionId
    };

    return this.http
      .delete<boolean>(API_URL + `api/web/reportingprofiles/${reportingProfileId}/unsubscribe`, httpOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Unsubscribed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public subscribeToProduct(reportingProfileId: string, product: string): Observable<boolean> {
    let body = {
      product: product
    };

    return this.http
      .post<boolean>(API_URL + `api/web/reportingprofiles/${reportingProfileId}/subscribe`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Subscribed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getReports(entityId: string, reportName: string, params: FilterParams): Observable<PageResult<Report>> {
    return this.http
      .get<PageResult<Report>>(API_URL + `api/web/reports/${reportName}/${entityId}?limit=10&page=${params.page}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Report>(Report), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReportTypes(): Observable<ReportType[]> {
    return this.http
      .get<ReportType[]>(API_URL + `api/web/reports/types`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result = [];
          Object.keys(response).forEach(pType => {
            let rNames: string[] = response[pType];
            result.push(new ReportType(pType, rNames));
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReportEntities(reportName: string, startDateTime: string, endDateTime: string): Observable<ReportEntity[]> {
    return this.http
      .get<ReportEntity[]>(API_URL + `api/web/reports/entities?reportName=${reportName}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`, getHttpInterceptedOptions)
      .pipe(
        map((response: any) => {
          let entities = response.entities;
          if (!entities) {
            return [];
          }

          let result = [];
          Object.keys(entities).forEach(entityId => {
            let next: any = entities[entityId];
            let nextEntity = plainToClass(ReportEntity, next);
            result.push(nextEntity);
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public buildCustomReport(entities: ReportEntity[], reportName: string, startDateTime: string, endDateTime: string, fileType: string) {
    let reportables = {};
    entities.forEach((reportable: ReportEntity) => {
      let entityId = reportable.entityId;
      reportables[entityId] = {
        "belongsTo": reportable.belongsTo,
        "entityId": reportable.entityId,
        "entityType": reportable.entityType,
        "name": reportable.name,
        "status": reportable.status
      }
    });

    let body = {
      "entities": reportables,
      "reportName": reportName,
      "startDateTime": startDateTime,
      "endDateTime": endDateTime,
      "fileType": fileType
    }

    return this.http
      .post(API_URL + `api/web/report`, body, getReportOptions)
      .subscribe((response: any) => this.handleAttachment(response))
  }

  public createReportingProfile(data: any): Observable<ReportingProfile> {
    return this.http
      .post<ReportingProfile>(API_URL + "api/web/reportingprofiles", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Created successfully");
          return plainToClass(ReportingProfile, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateReportingProfile(id: string, data: any): Observable<ReportingProfile> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<ReportingProfile>(API_URL + "api/web/reportingprofiles", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Updated successfully");
          return plainToClass(ReportingProfile, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateSubscriptionSettings(id: string, settings: any): Observable<Subscription> {
    let body = {
      "settings": settings,
      "id": id
    };
    return this.http
      .patch<Subscription>(API_URL + "api/web/subscriptions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Subscription</b>: Settings updated successfully");
          return plainToClass(Subscription, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get1000Notifications(): Observable<Notification[]> {
    return this.http
      .get<PageResult<Notification>>(API_URL + `api/web/notifications?limit=1000&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Notification>(Notification), response);
          let notificationsList = (paginated && paginated.results) || [];
          return notificationsList.filter(
            notification => notification.acknowledgeable);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public acknowledgeNotification(id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/web/notifications/${id}/acknowledge`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getNotificationSettingsTypes(): Observable<NotificationType[]> {
    return this.http
      .get<NotificationType[]>(API_URL + `api/web/notificationsettings/types`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(NotificationType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getNotificationSettingsList(): Observable<NotificationSettingsList> {
    return this.http
      .get<NotificationSettingsList>(API_URL + `api/web/notificationsettings`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          const list = plainToClass<NotificationSettings, any>(NotificationSettings, response);
          return new NotificationSettingsList(list);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReport_ReadyValidSettingsFor(entityId: string): Observable<any> {
    return this.http
      .get<NotificationSettingsList>(API_URL + `api/web/notificationsettings/validsettings/Report_Ready/${entityId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result = [];
          Object.keys(response["reportNames"]).map(function (key, index) {
            let reportName = key;
            let fileTypes = response["reportNames"][reportName]["fileTypes"];
            result.push({
              "reportName": reportName,
              "fileTypes": fileTypes
            });
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteNotificationSettings(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/notificationsettings/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Notification Settings</b>: Entry removed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createNotificationSettings(data: any): Observable<NotificationSettings> {
    return this.http
      .post<NotificationSettings>(API_URL + "api/web/notificationsettings", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Notification Settings</b>: Entry added successfully");
          return plainToClass(NotificationSettings, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Company` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Company>>} An `Observable` of the paginated result of `Company`s
   * @memberof RestService
   */
  public getAllCompanies(params: FilterParams, limit: number = 10): Observable<PageResult<Company>> {
    return this.http
      .get<PageResult<Company>>(API_URL + `api/web/admin/companies?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Company>(Company), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Companies(): Observable<Company[]> {
    return this.http
      .get<Company[]>(API_URL + `api/web/admin/companies?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Company>(Company), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createCompany(companyData: any, userData: any): Observable<Company> {
    let data = {
      company: companyData,
      user: {
        ...userData,
        username: userData.email
      }
    }

    return this.http
      .post<Company>(API_URL + "api/web/admin/companies", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Company added successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getCompany(): Observable<Company> {
    return this.http
      .get<Company>(API_URL + 'api/web/company', getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getCompanyBy(id: string): Observable<Company> {
    return this.http
      .get<Company>(API_URL + `api/web/admin/companies/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateCompany(id: string, data: any): Observable<Company> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Company>(API_URL + "api/web/company", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `DispatchGroup` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or  `createdAt.ASC`
   * @returns {Observable<PageResult<DispatchGroup>>} An `Observable` of the paginated result of `DispatchGroup`s
   * @memberof RestService
   */
  public getAllDispatchGroups(params: FilterParams): Observable<PageResult<DispatchGroup>> {
    return this.http
      .get<PageResult<DispatchGroup>>(API_URL + `api/web/dispatchgroups?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DispatchGroup>(DispatchGroup), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000DispatchGroups(): Observable<DispatchGroup[]> {
    return this.http
      .get<PageResult<DispatchGroup>>(API_URL + `api/web/dispatchgroups?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<DispatchGroup>(DispatchGroup), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000DispatchGroupsLight(): Observable<DispatchGroup[]> {
    return this.http
      .get<PageResult<DispatchGroup>>(API_URL + `api/web/dispatchgroups/light?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<DispatchGroup>(DispatchGroup), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000VehicleTypes(): Observable<VehicleType[]> {
    return this.http
      .get<PageResult<VehicleType>>(API_URL + `api/web/vehicletypes?limit=1000&sort=type.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<VehicleType>(VehicleType), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000VehicleTypesLight(): Observable<VehicleType[]> {
    return this.http
      .get<PageResult<VehicleType>>(API_URL + `api/web/vehicletypes/light?limit=1000&sort=type.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<VehicleType>(VehicleType), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createDispatchGroup(data: any): Observable<DispatchGroup> {
    let body = {
      name: data.name
    };
    return this.http
      .post<DispatchGroup>(API_URL + "api/web/dispatchgroups", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Dispatch Group</b>: Created successfully");
          return plainToClass(DispatchGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateDispatchGroup(id: string, data: any): Observable<DispatchGroup> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<DispatchGroup>(API_URL + `api/web/dispatchgroups/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Dispatch Group</b>: Updated successfully");
          return plainToClass(DispatchGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignDispatchGroupFromDriver(driverId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/drivers/${driverId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Dispatch Group unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDispatchGroupToDriver(driverId: string, id: string): Observable<Driver> {
    return this.http
      .request<Driver>("LINK", API_URL + `api/web/drivers/${driverId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Dispatch Group assigned successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignDispatchGroupFromVehicle(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/vehicles/${vehicleId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Dispatch Group unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDispatchGroupToVehicle(vehicleId: string, id: string): Observable<Vehicle> {
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/vehicles/${vehicleId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Dispatch Group assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignVehicleTypeFromVehicle(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/vehicles/${vehicleId}/vehicletype/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Vehicle Type unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignVehicleTypeToVehicle(vehicleId: string, id: string): Observable<Vehicle> {
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/vehicles/${vehicleId}/vehicletype/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Vehicle Type assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `FeedbackType` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `type.DESC` or  `createdAt.ASC`
   * @returns {Observable<PageResult<FeedbackType>>} An `Observable` of the paginated result of `FeedbackType`s
   * @memberof RestService
   */
  public getAllFeedbackTypes(params: FilterParams): Observable<PageResult<FeedbackType>> {
    return this.http
      .get<PageResult<FeedbackType>>(API_URL + `api/web/dispatching/feedback-types?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FeedbackType>(FeedbackType), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000FeedbackTypes(): Observable<FeedbackType[]> {
    return this.http
      .get<FeedbackType[]>(API_URL + `api/web/dispatching/feedback-types?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FeedbackType>(FeedbackType), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createFeedbackType(data: any): Observable<FeedbackType> {
    let body = {
      name: data.name,
      type: data.type
    };
    return this.http
      .post<FeedbackType>(API_URL + "api/web/dispatching/feedback-types", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Feedback Type</b>: Created successfully");
          return plainToClass(FeedbackType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateFeedbackType(id: string, data: any): Observable<FeedbackType> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<FeedbackType>(API_URL + `api/web/dispatching/feedback-types/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Feedback Type</b>: Updated successfully");
          return plainToClass(FeedbackType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `VehicleType` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `type.DESC` or  `createdAt.ASC`
   * @returns {Observable<PageResult<VehicleType>>} An `Observable` of the paginated result of `VehicleType`s
   * @memberof RestService
   */
  public getAllVehicleTypes(params: FilterParams): Observable<PageResult<VehicleType>> {
    return this.http
      .get<PageResult<VehicleType>>(API_URL + `api/web/vehicletypes?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<VehicleType>(VehicleType), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createVehicleType(data: any): Observable<VehicleType> {
    let body = {
      type: data.type,
      description: data.description,
      volume: data.volume,
      capacity: data.capacity,
      tareWeight: data.tareWeight,
    };
    return this.http
      .post<VehicleType>(API_URL + "api/web/vehicletypes", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle Type</b>: Created successfully");
          return plainToClass(VehicleType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateVehicleType(id: string, data: any): Observable<VehicleType> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<VehicleType>(API_URL + `api/web/vehicletypes/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle Type</b>: Updated successfully");
          return plainToClass(VehicleType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public addSource(sourceToken: string): Observable<Company> {
    let body = {
      "source": sourceToken
    };
    return this.http
      .post<Company>(API_URL + "api/web/company/addsource", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Billing Information updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public setDefaultReportingProfile(reportingProfileId: string): Observable<Company> {
    return this.http
      .patch<Company>(API_URL + `api/web/company/setdefaultreportingprofile/${reportingProfileId}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Default Reporting Profile was set successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `FuelTransaction` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort query parameter, e.g. `transactionId.ASC`
   * @param {number} [limit=10] amount of instances to fetch
   * @param {string} [entityId=null] entity ID to fetch transactions for, use `null` to fetch transactions for the entire Company
   * @returns {Observable<PageResult<FuelTransaction>>} An `Observable` of the paginated result of `FuelTransaction`s
   * @memberof RestService
   */
  public getAllFuelTransactions(params: FilterParams, limit: number = 10, entityId: string = null): Observable<PageResult<FuelTransaction>> {
    let entityURI = !!entityId ? `reportingProfileId=${entityId}&` : "";
    return this.http
      .get<PageResult<FuelTransaction>>(API_URL + `api/web/fuel?${entityURI}limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FuelTransaction>(FuelTransaction), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllVehicleFuelTransactions(vehicleId: string, params: FilterParams, limit: number = 10): Observable<PageResult<FuelTransaction>> {
    return this.http
      .get<PageResult<FuelTransaction>>(API_URL + `api/web/vehicles/${vehicleId}/fuel?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FuelTransaction>(FuelTransaction), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getFuelStatistics(entityId: string): Observable<FuelStatistics> {
    return this.http
      .get<PageResult<FuelStatistics>>(API_URL + `api/web/fuel/stats/${entityId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(FuelStatistics, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `name.ASC` logic, which is utilized in the `DashboardComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000DeviceProfiles(): Observable<DeviceProfile[]> {
    return this.http
      .get<DeviceProfile[]>(API_URL + `api/web/admin/device-profiles?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<DeviceProfile> = plainToClassFromExist(new PageResult<DeviceProfile>(DeviceProfile), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Device` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort query parameter, e.g. `iccid.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Device>>} An `Observable` of the paginated result of `Device`s
   * @memberof RestService
   */
  public getAllDevices(params: FilterParams, limit: number = 10): Observable<PageResult<Device>> {
    return this.http
      .get<PageResult<Device>>(API_URL + `api/web/devices?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Device>(Device), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDevice(id: string): Observable<Device> {
    return this.http
      .get<Device>(API_URL + `api/web/devices/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public assignDeviceToReportingProfile(deviceId: string, assignData: any): Observable<Device> {
    return this.http
      .patch<Device>(API_URL + `api/web/devices/${deviceId}/assigntoreportingprofile`, assignData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Assigned successfully");
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deactivateDevice(deviceId: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/devices/${deviceId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Deactivated successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Creates `Device` based on the provided `data`.
   * `data.company` should contain `id` and `pricingScheme` fields.
   */
  public addDevice(data: any): Observable<Device> {
    let body = {
      iccid: data.iccid,
      type: data.type,
      company: data.company,

      token: {
        additionalData: "data",
        duration: "86400s",
        name: "enterprises/LC0117x993/enrollmentTokens/123456",
        oneTimeOnly: false,
        policyName: "enterprises/LC0117x993/policies/truckspymobile-dedicated",
        user: {
          accountIdentifier: "67e0c5af-0890-4b37-87da-9f7c00711769"
        }
      }
    };
    if (!!data.imei) {
      body["imei"] = data.imei;
    }
    if (!!data.serialNumber) {
      body["serialNumber"] = data.serialNumber;
    }
    if (!!data.deviceProfile) {
      body["deviceProfile"] = data.deviceProfile;
    }

    return this.http
      .post<Device>(API_URL + "api/web/admin/devices", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Device added successfully");
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllInvoices(params: FilterParams): Observable<PageResult<Invoice>> {
    return this.http
      .get<PageResult<Invoice>>(API_URL + `api/web/company/invoices?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Invoice>(Invoice), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllInvoicesFor(companyId: string, params: FilterParams): Observable<PageResult<Invoice>> {
    return this.http
      .get<PageResult<Invoice>>(API_URL + `api/web/admin/companies/${companyId}/invoices?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Invoice>(Invoice), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllDiscountsFor(companyId: string, params: FilterParams): Observable<PageResult<Discount>> {
    return this.http
      .get<PageResult<Discount>>(API_URL + `api/web/admin/companies/${companyId}/discounts?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Discount>(Discount), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteDiscount(companyId: string, id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/companies/${companyId}/discounts/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Discount</b>: Discount canceled successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createDiscount(companyId: string, data: any): Observable<Discount> {
    return this.http
      .post<Discount>(API_URL + `api/web/admin/companies/${companyId}/discounts`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Discount</b>: Created successfully");
          return plainToClass(Discount, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public devicesEnable(companyId: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/web/admin/companies/${companyId}/devicesEnabled`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("Devices enabled successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public devicesDisable(companyId: string ): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/companies/${companyId}/devicesEnabled`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("Devices disabled successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public CreditAllow(companyId: string ): Observable<Company> {
    return this.http
      .patch<Company>(API_URL + `api/web/admin/companies/${companyId}/credit`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("Credit updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Customer` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or  `createdAt.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Customer>>} An `Observable` of the paginated result of `Customer`s
   * @memberof RestService
   */
  public getAllCustomers(params: FilterParams, limit: number = 10): Observable<PageResult<Customer>> {
    return this.http
      .get<PageResult<Customer>>(API_URL + `api/web/customers?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Customer>(Customer), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Customers(): Observable<Customer[]> {
    return this.http
      .get<Customer[]>(API_URL + `api/web/customers?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Customer>(Customer), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getCustomer(id: string): Observable<Customer> {
    return this.http
      .get<Customer>(API_URL + `api/web/customers/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Customer, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createCustomer(data: any): Observable<Customer> {
    return this.http
      .post<Customer>(API_URL + `api/web/customers`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Customer</b>: Created successfully");
          return plainToClass(Customer, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateCustomer(id: string, data: any): Observable<Customer> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Customer>(API_URL + `api/web/customers/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Customer</b>: Updated successfully");
          return plainToClass(Customer, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public setCustomerStatus(id: string, active: boolean): Observable<boolean> {
    return this.http
      .patch<boolean>(API_URL + `api/web/customers/${id}/${active ? "activate" : "deactivate"}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess(`<b>Customer</b>: Made ${active ? "active" : "inactive"} successfully`);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllUsers(params: FilterParams): Observable<PageResult<User>> {
    return this.http
      .get<PageResult<User>>(API_URL + `api/web/users?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<User>(User), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createUser(data: any): Observable<User> {
    let body = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.email,
      email: data.email,
      roles: [data.role]
    };
    return this.http
      .post<User>(API_URL + "api/web/users", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Created successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getStatistics(entityId: string, isCompany: boolean, periodType: string, dataSet: string): Observable<Statistics> {
    let entityType = isCompany ? "App\\Entity\\Company" : "App\\Entity\\ReportingProfile";
    return this.http
      .get<Statistics>(API_URL + `api/web/statistics?entityId=${entityId}&entityType=${entityType}&reportPeriodType=${periodType}&dataSetName=${dataSet}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Statistics, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getReportPeriods(): Observable<any[]> {
    // we want to exclude custom
    const CUSTOM = "CUSTOM";

    return this.http
      .get<any[]>(API_URL + "api/web/statistics/reportperiods", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result = [];
          Object.keys(response).forEach(key => {
            if (key != CUSTOM) {
              let value = response[key];
              result.push({
                "key": key,
                "value": value
              });
            }
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getStatisticsDatasets(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/statistics/datasets", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllConnections(params: FilterParams): Observable<PageResult<Connection>> {
    return this.http
      .get<PageResult<Connection>>(API_URL + `api/web/connections?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Connection>(Connection), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Connections(): Observable<Connection[]> {
    return this.http
      .get<Connection[]>(API_URL + `api/web/connections?limit=1000&page=1&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Connection> = plainToClassFromExist(new PageResult<Connection>(Connection), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getConnection(id: string): Observable<Connection> {
    return this.http
      .get<Connection>(API_URL + `api/web/connections/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createConnection(data: any): Observable<User> {
    return this.http
      .post<User>(API_URL + "api/web/connections", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Created successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateConnection(id: string, data: any): Observable<Connection> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Connection>(API_URL + "api/web/connections", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Updated successfully");
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleConnectionStatus(id: string, currentStatus: boolean): Observable<Connection> {
    let body = {
      "id": id,
      "enabled": !currentStatus
    };
    return this.http
      .patch<Connection>(API_URL + "api/web/connections", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Status changed successfully");
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public testConnection(id: string): Observable<boolean> {
    return this.http.get<any>(API_URL + `api/web/connections/${id}/test`, authOptionsTokenized)
      .pipe(
        map(response => {
          this.notifySuccess(response.message);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllOperationsFor(connectionId: string, params: FilterParams): Observable<PageResult<Operation>> {
    return this.http
      .get<PageResult<Operation>>(API_URL + `api/web/operations/${connectionId}?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Operation>(Operation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getUser(id: string): Observable<User> {
    return this.http
      .get<User>(API_URL + "api/web/users/" + id, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateUser(id: string, data: any): Observable<User> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<User>(API_URL + "api/web/users", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Updated successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateUserAttribute(name: string, value: string): Observable<boolean> {
    let body = {
      "name": name,
      "value": value
    };
    return this.http
      .patch<boolean>(API_URL + "api/web/user/attribute", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Preferences</b>: Updated preferences");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateUserAttributes(...attributes: Attribute[]): Observable<User> {
    let attributesArray = [];
    attributes.forEach(next => {
      attributesArray.push(
        {
          name: next.name,
          value: next.value
        }
      )
    });
    let body = {
      attributes: attributesArray
    };

    return this.http
      .patch<User>(API_URL + "api/web/user/attributes", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Preferences</b>: Updated preferences");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteUser(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/users/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Access revoked successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public doSearch(query: string, isAdmin: boolean): Observable<SearchResult[]> {
    if (!query) {
      return of([]);
    }

    let searchURI = isAdmin ? "admin/search" : "search";
    return this.http
      .get<SearchResult[]>(API_URL + `api/web/${searchURI}/${query}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(SearchResult, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigReportends(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/reportingprofiles/validreportend", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigRoles(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/users/roles", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigUnits(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/reportingprofiles/validunits", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigStates(): Observable<Dictionary> {
    return this.http
      .get<Dictionary>(API_URL + "api/web/public/configuration/states", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Dictionary, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigTimezones(): Observable<Dictionary> {
    return this.http
      .get<Dictionary>(API_URL + "api/web/public/configuration/timezones", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Dictionary, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigConnectionTypes(): Observable<ConnectionType> {
    return this.http
      .get<ConnectionType>(API_URL + "api/web/connections/types", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(ConnectionType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigLocalTime(timezone: string): Observable<LocalTime> {
    let timezoneEscaped = timezone.split("/").join("-");

    return this.http
      .get<LocalTime>(API_URL + `api/web/public/configuration/getlocaltime/${timezoneEscaped}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(LocalTime, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getDeviceTypes(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/devices/types", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get1000Devices(): Observable<Device[]> {
    return this.http
      .get<PageResult<Device>>(API_URL + `api/web/devices?limit=1000&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Device>(Device), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getEventsType(query: string): Observable<string[]> {
    return this.http.get<string[]>(API_URL + `api/web/${query}/types`, authOptionsTokenized)
      .pipe(
        map(response => {
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public doViewItem(item: any, filters: string[]) {
    let queryURL = API_URL + "api/web/"
    switch (item.type){
      case "Vehicle":
        queryURL += 'vehicles/'; break;
      case "Driver":
        queryURL += 'drivers/'; break;
      case "Device":
        queryURL += 'devices/'; break;
      default:
        return;
    }
    
    queryURL += item.id + '/events?page=1&limit=100&sort=datetime.DESC';

    if(filters.length)
      for(let filter of filters)  queryURL += "&events[]=" + filter;

    return this.http
      .get<any>(queryURL, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  private handleLoginError(error: HttpErrorResponse) {
    let message: string = error.status === 401
      ? "Incorrect user or password, please try again."
      : "Something bad happened, please try again later."
    return throwError(message);
  }

  private handleError(error: HttpErrorResponse, notificationService: NotificationService = this.notificationService): ObservableInput<any> {
    function notifyFailure(messageHTML: string) {
      notificationService.smallBox({
        content: `<i class='fa fa-exclamation-triangle'></i>&nbsp;${messageHTML}`,
        color: "#a90329",
        timeout: 4000
      });
    }

    let clientError: boolean = error.error instanceof ErrorEvent;
    let message: string = error.error.message || error.error.error.message;
    notifyFailure(`<b>Error<b/>: ${message}`);

    let consoleMessage: string = `${clientError ? "Client-side" : "Backend"} error occurred: ${message}` +
      `${clientError ? "" : `, status code ${error.status}`}`;
    console.error(consoleMessage);
    return throwError(error);
  }

  private notifySuccess(messageHTML: string) {
    this.notificationService.smallBox({
      content: `<i class='fa fa-check-circle-o'></i>&nbsp;${messageHTML}`,
      color: "#739e73",
      timeout: 4000
    });
  }

}

@Injectable()
export class GlobalFunctionsService {

  /**
   * Helper method to encode object parameter: stringify, escape, encode.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
   */
  public encodeParam(param: any) {
    let str = JSON.stringify(param);
    return btoa(unescape(encodeURIComponent(str)));
  }

  public decodeParam(paramStr) {
    let decoded = decodeURIComponent(escape(atob(paramStr)));
    return JSON.parse(decoded);
  }
}

@Injectable()
export class DataTableService {

  /**
   * Preares filter parameters based on the provided `DataTable` event.
   *
   * @param {*} data `DataTable`'s event configuration
   * @param {string[]} columns array of column names of the `DataTable` instance
   * @returns {FilterParams} return `FilterParams` instance with pagination and sorting parameters
   * @memberof DataTableService
   */
  public calculateParams(data: any, columns: string[]): FilterParams {
    let order = data.order[0];
    let orderColumn: string = columns[order.column];
    let orderType: string = order.dir;
    let page: number = data.start / data.length + 1;

    return new FilterParams(page, `${orderColumn}.${orderType}`);
  }

}

export * from './rest.model';
