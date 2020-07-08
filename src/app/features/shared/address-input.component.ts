import { Component, Input, OnChanges, Injectable, OnInit } from '@angular/core';
import { Store, select } from "@ngrx/store";
import { take } from 'rxjs/operators';

import { COUNTRIES } from '@app/core/smartadmin.config';
import { AuthState } from '@app/core/store/auth';
import { getConfigStatesKeyValues } from '@app/core/store/config';

@Injectable()
export class AddressUtil {

    states: any[];

    public firstState() {
        return (this.states && this.states.length >= 1 && this.states[0].key) || "";
    }
    public defaultAddress(): any {
        return {
            line1: "",
            line2: "",
            city: "",
            state: this.firstState(),
            zip: "",
            country: COUNTRIES[0].key
        };
    }

    constructor(private store: Store<AuthState>) {
        this.store.pipe(select(getConfigStatesKeyValues), take(1)).subscribe(val => {
            this.states = val;
        });
    }

}

@Component({
    selector: 'app-address-input',
    template:
        `<div class="form-group" [class.small-form-group]="compact">
        <label class="col-sm-4" for="line1{{prefix}}">Address 1</label>
        <div class="col-sm-8">
          <input class="input input-xs form-control" name="line1{{prefix}}" [(ngModel)]="address.line1">
        </div>
      </div>
      <div class="form-group" [class.small-form-group]="compact">
        <label class="col-sm-4" for="line2{{prefix}}">Address 2</label>
        <div class="col-sm-8">
          <input class="input input-xs form-control" name="line2{{prefix}}" [(ngModel)]="address.line2">
        </div>
      </div>
      <div class="form-group" [class.small-form-group]="compact">
        <label class="col-sm-4" for="city{{prefix}}">City</label>
        <div class="col-sm-8">
          <input class="input input-xs form-control" name="city{{prefix}}" [(ngModel)]="address.city">
        </div>
      </div>

      <div class="form-group" [class.small-form-group]="compact">
        <label class="col-sm-4" for="state{{prefix}}">State</label>
        <div class="col-sm-8">
          <select style="width:100%" name="state{{prefix}}" id="state{{prefix}}" [(ngModel)]="address.state" [disabled]="!isUSA">
            <option *ngFor="let s of states" [value]="s.key">{{s.value}}</option>
          </select>
        </div>
      </div>
      <div class="form-group" [class.small-form-group]="compact">
          <label class="col-sm-4" for="country{{prefix}}">Country</label>
          <div class="col-sm-8">
              <select style="width:100%" name="country{{prefix}}" id="country{{prefix}}" [(ngModel)]="address.country"
                  (ngModelChange)="onCountryChange($event)">
                  <option *ngFor="let c of countries" [value]="c.key">{{c.value}}</option>
              </select>
          </div>
      </div>

      <div class="form-group" [class.small-form-group]="compact">
        <label class="col-sm-4" for="zip{{prefix}}">Zip</label>
        <div class="col-sm-8">
          <input class="input input-xs form-control" name="zip{{prefix}}" [(ngModel)]="address.zip">
        </div>
      </div>`
})
export class AddressInputComponent implements OnChanges, OnInit {

    @Input() address: any;
    @Input() prefix: string;
    @Input() compact: boolean;

    countries = COUNTRIES;
    isUSA: boolean;
    states: any[];

    onCountryChange(value): void {
        this.isUSA = value === this.countries[0].key;
        this.address.state = this.isUSA ? this.addressUtil.firstState() : "";
    }

    /**
     * Constructor to instantiate an instance of AddressInputComponent.
     */
    constructor(
        private store: Store<AuthState>,
        private addressUtil: AddressUtil) {
        this.loadData();
    }

    ngOnInit() {
        this.store.pipe(select(getConfigStatesKeyValues), take(1)).subscribe(val => {
            this.states = val;
        });
    }

    ngOnChanges() {
        this.loadData();
    }

    loadData() {
        this.isUSA = !!this.address && this.address.country == this.countries[0].key;
    }

}
