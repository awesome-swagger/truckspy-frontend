import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { customersRouting } from './customers.routing';
import { CustomersComponent } from './customers.component';
import { CustomerViewComponent } from './view/customer-view.component';
import { CustomerBookingsComponent } from './view/customer-bookings/customer-bookings.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';

import { NgxMaskModule, IConfig } from 'ngx-mask'
export const maskOptions: Partial<IConfig> | (() => Partial<IConfig>) = {};

@NgModule({
  declarations: [CustomersComponent, CustomerViewComponent, CustomerBookingsComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    customersRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule,
    NgxMaskModule.forRoot(maskOptions)
  ]
})
export class CustomersModule { }
