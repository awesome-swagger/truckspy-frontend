import { ActivatedRoute } from '@angular/router';
import { Component, OnChanges, Input } from '@angular/core';

import { Vehicle } from '@app/core/services';

@Component({
  selector: 'app-vehicle-position',
  templateUrl: './position.component.html',
  styleUrls: ['./position.component.css']
})
export class VehiclePositionComponent implements OnChanges {

  vehicleId: string;
  @Input() vehicle: Vehicle;

  /**
   * Constructor to instantiate an instance of VehiclePositionComponent.
   */
  constructor(
    private route: ActivatedRoute) {
    this.vehicleId = this.route.snapshot.paramMap.get("id");
  }

  ngOnChanges() { }

}
