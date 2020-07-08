import { Component, Input, OnChanges } from '@angular/core';

@Component({
    selector: 'app-password-hider',
    template:
        `<a class="action-link" (click)="showPassword = true" *ngIf="isPassword && !showPassword">(show)</a>
        <span *ngIf="!isPassword || showPassword">
            {{fieldValue}}
        </span>`
})
export class PasswordHiderComponent implements OnChanges {

    isPassword: boolean;
    showPassword = false;
    @Input() fieldName: string;
    @Input() fieldValue: string;

    constructor() {
        this.isPassword = ["Password", "password"].includes(this.fieldName);
    }

    ngOnChanges() {
        this.isPassword = ["Password", "password"].includes(this.fieldName);
    }

}
