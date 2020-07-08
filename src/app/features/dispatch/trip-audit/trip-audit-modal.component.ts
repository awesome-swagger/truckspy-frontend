import { Component, Input, TemplateRef, OnInit } from '@angular/core';
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { plainToClass } from "class-transformer";

import { Trip, RestService, TripChangeLog, ChangeLogInitiatorType, Connection, Driver, Company, LocalStorageService, User } from '@app/core/services/rest.service';
import { getConfigCompany } from '@app/core/store/config';
import { LoggedInAs, LoggedOutAs } from '@app/core/store/auth';

@Component({
    selector: 'app-trip-audit-modal',
    templateUrl: './trip-audit-modal.component.html'
})
export class TripAuditModalComponent implements OnInit {

    company: Company;
    loginAsCompany: Company;

    initiatorTypes = ChangeLogInitiatorType;

    @Input() trip: Trip;
    @Input() connections: Connection[];
    @Input() drivers: Driver[];
    logs: TripChangeLog[];

    getConnection(id: string) {
        let connection = this.connections.find(function (next) {
            return next.id === id;
        });
        return connection;
    }

    getDriver(id: string) {
        let driver = this.drivers.find(function (next) {
            return next.id === id;
        });
        return driver;
    }

    getWebUser(id: string) {
        let company: Company = this.theCompany();
        let users: User[] = !!company ? company.users || [] : [];
        let user = users.find(function (next) {
            return next.id === id;
        });
        return !!user ? plainToClass(User, user as User) : null;
    }

    constructor(
        private store: Store<any>,
        private actions$: Actions,
        private restService: RestService,
        private modalService: BsModalService,
        private lsService: LocalStorageService) {
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
    theCompany() {
        return !!this.loginAsCompany ? this.loginAsCompany : this.company;
    }

    ngOnInit() {
        this.store.select(getConfigCompany).subscribe((company: Company) => {
            this.company = company;
        });
        this.loginAsCompany = this.lsService.getCompany();
    }

    /**
     * Trip Audit modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _tripAuditModal: BsModalRef;
    showTripAuditModal(template: TemplateRef<any>) {
        this.restService.get1000TripChangeLogs(this.trip.id)
            .subscribe(
                data => {
                    this.logs = data;
                    this._tripAuditModal = this.modalService.show(template, { class: "modal-lg" });
                }
            );
    }
    closeTripAuditModal(): void {
        this._tripAuditModal.hide();
    }

}
