import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { reportingRouting } from './reporting.routing';
import { ReportingComponent } from './reporting.component';
import { ReportingViewComponent } from './view/reporting-view.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [ReportingComponent, ReportingViewComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    reportingRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule
  ]
})
export class ReportingModule { }
