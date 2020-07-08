import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-long-action-link',
    template:
        `<a (click)="doAction()" *ngIf="!inProgress">
            <ng-container *ngIf="icon">
                <i class="fa fa-{{iconName}} fa-lg"></i>
            </ng-container>
            <ng-container *ngIf="!icon">
                {{actionName}}
            </ng-container>
        </a>
        <span *ngIf="inProgress">
            <ng-container *ngIf="icon">
                <i class="fa fa-spinner fa-spin"></i>
            </ng-container>
            <ng-container *ngIf="!icon">
                wait...
            </ng-container>
        </span>`
})
export class LongActionLinkComponent implements OnChanges {

    inProgress: boolean;
    @Input() actionName: string;
    @Input() actionParams: any[];
    @Input() icon: boolean;
    @Input() iconName: string;
    @Output() actionClicked: EventEmitter<any> = new EventEmitter();

    constructor() {
        this.inProgress = false;
    }

    ngOnChanges() {
        this.inProgress = false;
    }

    actionFailed() {
        this.inProgress = false;
    }

    doAction() {
        this.inProgress = true;
        this.actionClicked.emit([...this.actionParams, this]);
    }

}
