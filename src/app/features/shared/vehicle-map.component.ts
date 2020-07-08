import { Component, OnChanges, Input, ViewChild } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Map } from 'mapbox-gl';

import { Vehicle } from '@app/core/services';
import { MinifyMenu } from '@app/core/store/layout';
import { mapConfig } from '@app/core/smartadmin.config';

@Component({
  selector: 'app-vehicle-map',
  templateUrl: './vehicle-map.component.html'
})
export class VehicleMapComponent implements OnChanges {

  @Input() vehicle: Vehicle;

  /**
   * Bounds definition for the map to fit.
   */
  fitBounds: number[][] = [];
  fitBoundsOptions = {
    padding: { top: 25, bottom: 25, left: 25, right: 25 }
  }

  @ViewChild("vehicleMarker") vehicleMarker: any;
  theMapInstance: Map;

  onLoad(mapInstance: Map) {
    this.theMapInstance = mapInstance;
    this.vehicleMarker.markerInstance.togglePopup();
  }

  onMinifyMenu = this.actions$.subscribe(action => {
    if (action instanceof MinifyMenu) {
      this.theMapInstance.resize();
    }
  });

  /**
   * Map styling logic.
   */
  style: string = mapConfig.STREETS;
  isDefault: boolean = true;
  toggleStyle() {
    this.style = this.isDefault ? mapConfig.SATELLITE : mapConfig.STREETS;
    this.isDefault = !this.isDefault;
  }

  /**
   * Constructor to instantiate an instance of VehicleMapComponent.
   */
  constructor(
    private actions$: Actions) {
  }

  ngOnChanges() {
    this.calculateForMap();
  }

  calculateForMap() {
    if (this.vehicle && this.vehicle.hasLastPosition()) {
      this.fitBounds = [
        [this.vehicle.lastPosition.longitude - 0.25, this.vehicle.lastPosition.latitude - 0.25],
        [this.vehicle.lastPosition.longitude + 0.25, this.vehicle.lastPosition.latitude + 0.25]
      ];
    }
  }

}
