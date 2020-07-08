import { Component, Input, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { DomicileLocation } from '@app/core/services/rest.service';

@Component({
    selector: 'app-location-map-modal',
    templateUrl: './location-map-modal.component.html'
})
export class LocationMapModalComponent {

    @Input() location: DomicileLocation;
    @Input() highlight: string;

    constructor(
        private modalService: BsModalService) {
    }

    /**
     * Location map modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _locationMapModal: BsModalRef;
    showLocationMapModal(template: TemplateRef<any>) {
        this._locationMapModal = this.modalService.show(template, { class: "modal-lg" });
    }
    closeLocationMapModal(): void {
        this._locationMapModal.hide();
    }

}
