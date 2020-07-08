import { Component, Input, TemplateRef, OnInit, Output, EventEmitter } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { RestService, Vehicle } from '@app/core/services/rest.service';

@Component({
    selector: 'app-ignore-error-modal',
    templateUrl: './ignore-error-modal.component.html'
})
export class IgnoreErrorModalComponent implements OnInit {

    @Input() vehicle: Vehicle;
    @Output() callback: EventEmitter<any> = new EventEmitter();
    miles: string = ``;

    constructor(
        private restService: RestService,
        private modalService: BsModalService) {
    }

    ngOnInit() {
        // Extract miles from the error message
        let errorMessage = this.vehicle && this.vehicle.lastOperation && this.vehicle.lastOperation.errorMessage;
        if (!!errorMessage) {
            let result = (errorMessage.match(/\d+/g) || []).map(n => parseInt(n));
            if (result && result.length > 0) {
                this.miles = `${result[0]} `
            }
        }
    }

    /**
     * Ignore Error modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _ingoreErrorModal: BsModalRef;
    showIngoreErrorModal(template: TemplateRef<any>) {
        this._ingoreErrorModal = this.modalService.show(template, { class: "modal-400" });
    }
    closeIngoreErrorModal(): void {
        this._ingoreErrorModal.hide();
    }

    doIngoreError() {
        this.restService.ignoreVehicleErrors(this.vehicle.id)
            .subscribe(
                success => {
                    this.restService.getVehicle(this.vehicle.id)
                        .subscribe(
                            updated => {
                                // this._ingoreErrorModal.hide();
                                this.callback.emit([updated, this]);
                            }
                        );
                }
            );
    }

}
