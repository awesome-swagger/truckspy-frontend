import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { dashboardRouting } from './dashboard.routing';
import { DashboardComponent } from './dashboard.component';
import { NgSelectModule } from '@ng-select/ng-select';

import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import stock from 'highcharts/modules/stock.src';
import more from 'highcharts/highcharts-more.src';
export function highchartsModules() {
  return [stock, more];
}

import { SharedModule } from '@app/shared/shared.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    NgSelectModule,
    ChartModule,
    CommonModule,
    dashboardRouting,
    SharedModule,
    FeaturesSharedModule
  ],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: highchartsModules }
  ]

})
export class DashboardModule { }
