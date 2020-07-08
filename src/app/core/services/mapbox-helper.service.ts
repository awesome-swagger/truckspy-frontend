import { Injectable } from '@angular/core';

import { DomicileLocation, Position } from './rest.model';

@Injectable()
export class MapboxHelperService {

  constructor() { }

  public calculateBounds(locations: DomicileLocation[]): number[][] {
    if (!locations || locations.length === 0) {
      // USA (without Alaska) bounds
      return [[-124.848974, 24.396308], [-66.885444, 49.384358]];
    }
    // let's take into account all rings and all points:
    let rings = locations.reduce((a, c) => [].concat(a, !!c.polygon && !!c.polygon.rings && c.polygon.rings[0] || [], !!c.point && [[c.point.x, c.point.y]]) || [], []);

    if (rings.length === 1) {
      let point = rings[0];
      return [
        [point[0] - 0.025, point[1] - 0.025],
        [point[0] + 0.025, point[1] + 0.025]
      ];
    }
    let minLng = 181;
    let maxLng = -181;
    let minLat = 91;
    let maxLat = -91;
    rings.forEach(function (next) {
      if (minLng > next[0]) {
        minLng = next[0];
      }
      if (maxLng < next[0]) {
        maxLng = next[0];
      }
      if (minLat > next[1]) {
        minLat = next[1];
      }
      if (maxLat < next[1]) {
        maxLat = next[1];
      }
    });
    return [[minLng, minLat], [maxLng, maxLat]];
  }

  public calculatePositionsBounds(positions: Position[]): number[][] {
    if (!positions || positions.length === 0) {
      // USA (without Alaska) bounds
      return [[-124.848974, 24.396308], [-66.885444, 49.384358]];
    }

    if (positions.length === 1) {
      let position = positions[0];
      return [
        [position.longitude - 0.25, position.latitude - 0.25],
        [position.longitude + 0.25, position.latitude + 0.25]
      ];
    }
    let minLng = 181;
    let maxLng = -181;
    let minLat = 91;
    let maxLat = -91;
    positions.forEach(function (next) {
      if (minLng > next.longitude) {
        minLng = next.longitude;
      }
      if (maxLng < next.longitude) {
        maxLng = next.longitude;
      }
      if (minLat > next.latitude) {
        minLat = next.latitude;
      }
      if (maxLat < next.latitude) {
        maxLat = next.latitude;
      }
    });
    return [[minLng, minLat], [maxLng, maxLat]];
  }

}
