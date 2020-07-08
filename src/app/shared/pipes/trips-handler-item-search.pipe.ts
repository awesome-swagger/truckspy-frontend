import { Pipe, PipeTransform } from '@angular/core';
import { TripsHandlerItem, Stop, Trip } from '@app/core/services/rest.model';

@Pipe({
    name: 'tripsHandlerItemSearch',
})
export class TripsHandlerItemSearchPipe implements PipeTransform {

    transform(items: TripsHandlerItem[], query: string = ""): any {
        function stopMatches(stop: Stop, theQuery: string) {
            if (!stop) {
                return false;
            }
            let isLocation = stop.isLocation();
            let ncQuery = theQuery.toLowerCase();

            return (isLocation && !!stop.location.name && stop.location.name.toLowerCase().includes(ncQuery)) ||
                (!isLocation && !!stop.address && stop.address.getAddress().toLowerCase().includes(ncQuery));
        }

        if (!items || items.length === 0 || !query) {
            return items;
        }
        let noCaseQuery = query.toLowerCase();

        let result: TripsHandlerItem[] = [];
        items.forEach(function (item: TripsHandlerItem) {
            let vehicleMatches: boolean = !!item.vehicle && (item.vehicle.remoteId || '(unspecified)').toLowerCase().includes(noCaseQuery);
            let driverMatches: boolean = !!item.driver && (item.driver.name() + ' (' + (item.driver.remoteId || '(unspecified)') + ')').toLowerCase().includes(noCaseQuery);
            if (vehicleMatches || driverMatches) {
                result.push(item);
            } else {
                let filteredTrips = item.trips.filter(
                    (trip: Trip) => {
                        let tripNoMatches: boolean = !!trip.tripNo && trip.tripNo.toLowerCase().includes(noCaseQuery);
                        let statusMatches: boolean = !!trip.status && trip.status.toLowerCase().includes(noCaseQuery);
                        let firstStopMatches: boolean = stopMatches(trip.getFirstStop(), query);
                        let lastStopMatches: boolean = stopMatches(trip.getLastStop(), query);
                        return tripNoMatches || statusMatches || firstStopMatches || lastStopMatches;
                    })

                if (filteredTrips.length > 0) {
                    let newItem: TripsHandlerItem = new TripsHandlerItem(item.vehicle || item.driver, filteredTrips);
                    result.push(newItem);
                }
            }
        });

        return result;
    }

}
