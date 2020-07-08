import { Component, Input, OnChanges, Output, EventEmitter, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import {
    RestService, VehicleType, Customer, FeedbackType, StopLoadType, DomicileLocation
} from '@app/core/services/rest.service';
import { AddressUtil } from '@app/features/shared/address-input.component';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
    selector: 'app-create-booking',
    templateUrl: './create-booking.component.html'
})
export class CreateBokingComponent implements OnChanges {

    inProgress: boolean;
    @Input() linkName: string;
    @Output() callback: EventEmitter<any> = new EventEmitter();

    constructor(
        private restService: RestService,
        private dateService: DateService,
        private modalService: BsModalService,
        private addressUtil: AddressUtil) {
    }

    ngOnChanges() { }

    /**
     * Add Booking modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _addBookingModal: BsModalRef;
    @Input() customers: Customer[];
    @Input() types: VehicleType[];
    @Input() feedbackTypes: FeedbackType[];
    @Input() locations: DomicileLocation[] = [];
    loadedTypes = [StopLoadType.EMPTY, StopLoadType.LOADED];
    bookingData: any = {};

    addBooking(template: TemplateRef<any>) {
        this.UNIQUE_ID = 1;
        this.bookingData = {
            customerId: (!!this.customers && this.customers.length > 0 && this.customers[0].id) || "",
            typeId: "",
            stops: []
        }

        // Required to add 2 stops
        this.addStop();
        this.addStop();

        this._addBookingModal = this.modalService.show(template, { class: "modal-lg" });
    }

    /**
     * Unique ID holder to utilize within view for name/id fields (avoiding view mixed up for input values).
     */
    UNIQUE_ID: number;
    addStop() {
        let stops = this.bookingData.stops;
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
        this.bookingData.stops.splice(index, 1);
    }

    createBooking(): void {
        let dateService = this.dateService;
        let body = {
            "customer": {
                "id": this.bookingData.customerId
            },
            "vehicleType": !this.bookingData.typeId ? null : {
                "id": this.bookingData.typeId
            },
            "stops": this.bookingData.stops.map((stop: any, index: number) => (
                {
                    "stopOrder": index + 1,
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

        this.restService.createBooking(body)
            .subscribe(
                data => {
                    console.log(data);
                    this._addBookingModal.hide();
                    this.callback.emit([]);
                }
            );
    }
    closeBookingModal(): void {
        this._addBookingModal.hide();
    }

}
