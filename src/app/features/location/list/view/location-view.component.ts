import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { take } from 'rxjs/operators'

import { RestService, DomicileLocation } from '@app/core/services'
import { ExitEditMode } from '@app/core/store/shortcuts';
import { ConfigState, getConfigStatesKeyValues } from '@app/core/store/config';

@Component({
  selector: 'app-location-view',
  templateUrl: './location-view.component.html',
  styleUrls: ['./location-view.component.css']
})
export class LocationViewComponent implements OnInit {

  locationId: string;
  location: DomicileLocation = new DomicileLocation();
  loaded: boolean = false;
  states: any[];

  /**
   * Edit Location logic.
   */
  edit: boolean = false;
  locationData = {};

  beginEdit() {
    this.locationData = {
      id: this.location.id,
      name: this.location.name,
      address1: this.location.address1,
      address2: this.location.address2,
      city: this.location.city,
      state: this.location.state,
      country: this.location.country,
      zip: this.location.zip
    };
    this.edit = true;
  }
  cancelEdit() {
    this.edit = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEdit();
    }
  });

  save() {
    this.restService.updateLocation(this.locationData)
      .subscribe(
        data => {
          this.location = data;
          this.edit = false;
        }
      );
  }

  /**
   * Constructor to instantiate an instance of LocationViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private actions$: Actions,
    private restService: RestService,
    private store: Store<ConfigState>) { }

  ngOnInit() {
    this.store.pipe(select(getConfigStatesKeyValues), take(1)).subscribe(val => {
      this.states = val;
    });

    this.locationId = this.route.snapshot.paramMap.get("id");
    this.restService.getLocation(this.locationId)
      .subscribe(result => {
        this.location = result;
        this.loaded = true;
      });
  }

}
