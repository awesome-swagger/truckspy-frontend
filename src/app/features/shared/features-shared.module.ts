import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { AddressInputComponent, AddressUtil } from './address-input.component';
import { CreateBokingComponent } from './create-booking.component';
import { DwellEventsComponent } from './dwellevents.component';
import { ReportsTableComponent } from './reports-table.component';
import { ReportsTableReportbasedComponent } from './reports-table-reportbased.component';
import { PasswordHiderComponent } from './password-hider.component';
import { LongActionLinkComponent } from './long-action-link.component';
import { InfoPanelComponent } from './info-panel.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { NgxMapboxGLModule } from "ngx-mapbox-gl";
import { MAPBOX_ACCESS_TOKEN } from "@app/core/smartadmin.config";
import { LocationMapComponent } from "./location-map.component";
import { VehicleMapComponent } from "./vehicle-map.component";
import { LocationMapModalComponent } from './location-map-modal.component';
import { VehicleMapModalComponent } from './vehicle-map-modal.component';
import { NgHighlightModule } from 'ngx-text-highlight';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    NgSelectModule,
    SmartadminDatatableModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    NgHighlightModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    })
  ],
  providers: [AddressUtil],
  declarations: [
    AddressInputComponent, CreateBokingComponent, DwellEventsComponent,
    ReportsTableComponent,
    ReportsTableReportbasedComponent,
    PasswordHiderComponent,
    LongActionLinkComponent,
    InfoPanelComponent,
    LocationMapComponent,
    VehicleMapComponent,
    LocationMapModalComponent,
    VehicleMapModalComponent
  ],
  exports: [
    AddressInputComponent, CreateBokingComponent, DwellEventsComponent,
    ReportsTableComponent,
    ReportsTableReportbasedComponent,
    PasswordHiderComponent,
    LongActionLinkComponent,
    InfoPanelComponent,
    LocationMapComponent,
    VehicleMapComponent,
    LocationMapModalComponent,
    VehicleMapModalComponent
  ]
})
export class FeaturesSharedModule { }
