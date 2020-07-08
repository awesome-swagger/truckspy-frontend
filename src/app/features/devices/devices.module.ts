import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { devicesRouting } from './devices.routing';
import { DevicesComponent } from './devices.component';
import { DeviceViewComponent } from './view/device-view.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [DevicesComponent, DeviceViewComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    devicesRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule
  ]
})
export class DevicesModule { }
