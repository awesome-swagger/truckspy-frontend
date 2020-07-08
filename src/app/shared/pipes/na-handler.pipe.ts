import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'naHandler',
})
export class NaHandlerPipe implements PipeTransform {

    transform(value: any): any {
        return !value && value !== 0 ? "N/A" : value;
    }

}
