import { ActivatedRoute } from '@angular/router';
import { Component, OnChanges, Input } from '@angular/core';

import { DomicileLocation } from '@app/core/services';

@Component({
  selector: 'app-location-position',
  templateUrl: './location-position.component.html',
  styleUrls: ['./location-position.component.css']
})
export class LocationPositionComponent implements OnChanges {

  locationId: string;
  @Input() location: DomicileLocation;

  /**
   * Constructor to instantiate an instance of LocationPositionComponent.
   */
  constructor(
    private route: ActivatedRoute) {
    this.locationId = this.route.snapshot.paramMap.get("id");
  }

  ngOnChanges() { }

}
