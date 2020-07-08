import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { driversRouting } from './drivers.routing';
import { DriversComponent } from './drivers.component';
import { DriverViewComponent } from './view/driver-view.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [DriversComponent, DriverViewComponent],
  imports: [
    CommonModule,
    driversRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule
  ]
})
export class DriversModule { }
