import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bookingsRouting } from './bookings.routing';
import { BookingsComponent } from './bookings.component';
import { BookingViewComponent } from './view/booking-view.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [BookingsComponent, BookingViewComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    bookingsRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule
  ]
})
export class BookingsModule { }
