import { Pipe, PipeTransform } from "@angular/core";
import { Vehicle } from "@app/core/services/rest.service";
import * as moment from "moment";

@Pipe({
  name: "vehiclesMapItems",
})
export class VehiclesMapItems implements PipeTransform {
  transform(vehicles: Vehicle[]): any {
    let reslut = vehicles.filter((v) => {
      if (v.status !== "(active)") return false;
      let lastTime = moment.utc(v.lastPosition.datetime);
      let hours = moment().diff(lastTime, "hours");
      return hours < 24;
    });
    console.log(reslut);
    return reslut;
  }
}
