import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { reportsRouting } from './reports.routing';
import { ReportsComponent } from './reports.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [ReportsComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    reportsRouting,
    SmartadminDatatableModule,
    AngularMultiSelectModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule
  ]
})
export class ReportsModule { }
