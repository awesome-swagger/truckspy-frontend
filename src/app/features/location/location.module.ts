import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import stock from 'highcharts/modules/stock.src';
import more from 'highcharts/highcharts-more.src';
export function highchartsModules() {
  return [stock, more];
}

import { locationRouting } from './location.routing';
import { LocationsComponent } from './locations/locations.component';
import { LocationsListComponent } from './list/locations-list.component';
import { LocationPositionComponent } from './list/view/position/location-position.component';
import { LocationViewComponent } from './list/view/location-view.component';
import { DwellStatsComponent } from './list/view/dwellstats/dwellstats.component';
import { GroupsComponent } from './groups/groups.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@app/core/smartadmin.config';
import { NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [LocationsComponent, LocationsListComponent, LocationPositionComponent, LocationViewComponent,
    DwellStatsComponent, GroupsComponent],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    ChartModule,
    CommonModule,
    locationRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    NgbTypeaheadModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    }),
    FeaturesSharedModule
  ],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: highchartsModules }
  ]
})
export class LocationModule { }
