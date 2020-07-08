import { Component, Input, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { Vehicle } from '@app/core/services/rest.service';

@Component({
    selector: 'app-vehicle-map-modal',
    templateUrl: './vehicle-map-modal.component.html'
})
export class VehicleMapModalComponent {

    @Input() vehicle: Vehicle;
    @Input() highlight: string;

    constructor(
        private modalService: BsModalService) {
    }

    /**
     * Vehicle map modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _vehicleMapModal: BsModalRef;
    showVehicleMapModal(template: TemplateRef<any>) {
        this._vehicleMapModal = this.modalService.show(template, { class: "modal-lg" });
    }
    closeVehicleMapModal(): void {
        this._vehicleMapModal.hide();
    }

}
