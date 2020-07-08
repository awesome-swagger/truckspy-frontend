import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import * as moment from 'moment';

import { ConfigState, getConfigLocalTime } from '@app/core/store/config';
import { Pipe, PipeTransform } from '@angular/core';

enum TimeZoneAbbreviation {
    CDT = "CDT",
    CST = "CST"
}

const APP_DATE_FORAT = "YYYY-MM-DDTHH:mm:ss";

@Pipe({
    name: 'timezoneHandler',
})
export class TimezoneHandlerPipe implements PipeTransform {

    offset: number;
    timezone: string;
    timezoneAbbreviation: string;

    transform(value: any, straight: boolean = true): any {
        if (!value) {
            return "";
        }
        // let utcValue = (typeof value === "string" && !value.endsWith('Z')) ? value + 'Z' : value;
        var somedatetime = (value instanceof Date) ? value : moment(value, APP_DATE_FORAT).toDate();

        let dstOffset: number = this.getAdditionalOffset(somedatetime);
        somedatetime.setHours(somedatetime.getHours() + (straight ? (this.offset + dstOffset) : -(this.offset + dstOffset)));
        return somedatetime;
    }

    private getAdditionalOffset(date: Date): number {
        let strValue = date.toLocaleString("en-US", { timeZone: this.timezone, timeZoneName: "short" });
        let isCDT = strValue.indexOf(TimeZoneAbbreviation.CDT) != -1;
        let isCST = strValue.indexOf(TimeZoneAbbreviation.CST) != -1;

        if (isCDT && this.timezoneAbbreviation === TimeZoneAbbreviation.CST) { // `date` is in CDT, current time is CST
            return 1;
        }
        if (isCST && this.timezoneAbbreviation === TimeZoneAbbreviation.CDT) { // `date` is in CST, current time is CDT
            return -1;
        }
        return 0;
    }

    constructor(private store: Store<ConfigState>) {
        this.store.select(getConfigLocalTime).subscribe((localTime: any) => {
            this.offset = localTime.UTCOffset;
            this.timezone = localTime.timezone;
            this.timezoneAbbreviation = localTime.timezoneAbbreviation;
        });
    }

}

@Injectable()
export class DateService {

    constructor(
        private timezoneHandler: TimezoneHandlerPipe,
        private datepipe: DatePipe) { }

    getCurrentTime(): Date {
        let dateStr = this.datepipe.transform(Date.now(), 'yyyy-MM-dd, HH:mm:ss', '+0000');
        return this.timezoneHandler.transform(dateStr);
    }

    transformDateTime(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyy-MM-dd, HH:mm:ss');
    }

    transformDwellDateTime(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyy-MM-dd, HH:mm');
    }

    transformDwellDuration(seconds: number): string {
        // YYYY-MM-DDTHH:MM:SS.000Z
        return !!seconds ? new Date(seconds * 1000).toISOString().substr(11, 5) : "00:00";
    }

    transformDate(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyy-MM-dd');
    }

    transformDateYYYYMMDD(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyyMMdd');
    }

    transform4Backend(date: Date): string {
        return !date ? null : moment(date).utc().format('YYYY-MM-DDTHH:mm:ss');
    }

    transform2OdometerDate(date: Date): string {
        return !date ? null : this.datepipe.transform(date, 'yyyy-MM-dd');
    }

    transform2Time(date: Date): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'HH:mm:ss');
    }

    plusHours(date: Date, hours: number): Date {
        return new Date(date.getTime() + hours * 3600000);
    }

}
