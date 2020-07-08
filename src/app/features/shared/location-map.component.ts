import { Component, OnChanges, Input } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Map } from 'mapbox-gl';

import { DomicileLocation, MapboxHelperService } from '@app/core/services';
import { MinifyMenu } from '@app/core/store/layout';
import { mapConfig } from '@app/core/smartadmin.config';

@Component({
  selector: 'app-location-map',
  templateUrl: './location-map.component.html'
})
export class LocationMapComponent implements OnChanges {

  @Input() location: DomicileLocation;

  /**
   * Bounds definition for the map to fit.
   */
  fitBounds: number[][] = this.mbHelper.calculateBounds(null);
  fitBoundsOptions = {
    padding: { top: 120, bottom: 120, left: 120, right: 120 }
  }

  theMapInstance: Map;
  imageLoaded: boolean = false;
  onLoad(mapInstance: Map) {
    this.theMapInstance = mapInstance;
    // this.theMapInstance.loadImage('https://api.tiles.mapbox.com/v3/marker/pin-s+FE2020.png', function (error, image) {
    //   if (error) throw error;
    //   this.theMapInstance.addImage('pin-image', image);
    // }.bind(this));
  }
  onMinifyMenu = this.actions$.subscribe(action => {
    if (action instanceof MinifyMenu) {
      this.theMapInstance.resize();
    }
  });

  /**
   * Map styling logic.
   * We want to show SATELLITE by default (`isDefault` defines application defaulr behavior, which is STREETS).
   */
  style: string = mapConfig.SATELLITE;
  isDefault: boolean = false;
  toggleStyle() {
    this.style = this.isDefault ? mapConfig.SATELLITE : mapConfig.STREETS;
    this.isDefault = !this.isDefault;
  }

  /**
   * Constructor to instantiate an instance of LocationMapComponent.
   */
  constructor(
    private actions$: Actions,
    private mbHelper: MapboxHelperService) {
  }

  ngOnChanges() {
    this.calculateForMap();
  }

  calculateForMap() {
    if (!!this.location && (this.location.isPolygon() || this.location.isPoint())) {
      this.fitBounds = this.mbHelper.calculateBounds([this.location]);
    }
  }

}
