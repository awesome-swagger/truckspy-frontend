import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

import { DateService } from './timezone-handler.pipe';

@Pipe({
    name: 'messageDate',
})
export class MessageDatePipe implements PipeTransform {

    transform(value: any): any {
        if (!value) {
            return "";
        }
        let currentDay: Date = this.dateService.getCurrentTime();
        let valueDate: Date = moment(this.dateService.transformDateTime(value), 'YYYY-MM-DD, hh:mm:ss').toDate();
        let isToday = (currentDay.toDateString() == valueDate.toDateString());
        let isCurrentYear = (currentDay.getFullYear() == valueDate.getFullYear());
        let format = isCurrentYear ? (isToday ? 'h:mm a' : 'MMM d') : 'M/d/yy';
        return this.datepipe.transform(valueDate, format);
    }

    constructor(
        private dateService: DateService,
        private datepipe: DatePipe) { }

}
