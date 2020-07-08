import { Pipe, PipeTransform } from '@angular/core';
import { Booking, Stop } from '@app/core/services/rest.model';

@Pipe({
    name: 'bookingSearch',
})
export class BookingSearchPipe implements PipeTransform {

    transform(theArray: Booking[], query: string = ""): any {
        function stopMatches(stop: Stop, theQuery: string) {
            if (!stop) {
                return false;
            }
            let isLocation = stop.isLocation();
            let ncQuery = theQuery.toLowerCase();

            return (isLocation && !!stop.location.name && stop.location.name.toLowerCase().includes(ncQuery)) ||
                (!isLocation && !!stop.address && stop.address.getAddress().toLowerCase().includes(ncQuery));
        }

        if (!theArray || theArray.length === 0 || !query) {
            return theArray;
        }
        let noCaseQuery = query.toLowerCase();
        return theArray.filter(
            (booking: Booking) => {
                let bookNoMatches: boolean = !!booking.bookNo && booking.bookNo.toLowerCase().includes(noCaseQuery);
                let customerNameMatches: boolean = !!booking.customer.name && booking.customer.name.toLowerCase().includes(noCaseQuery);
                let firstStopMatches: boolean = stopMatches(booking.getFirstStop(), query);
                let lastStopMatches: boolean = stopMatches(booking.getLastStop(), query);
                return bookNoMatches || customerNameMatches || firstStopMatches || lastStopMatches;
            });
    }

}
