import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fuelRouting } from './fuel.routing';
import { FuelComponent } from './fuel.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';

@NgModule({
  declarations: [FuelComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    fuelRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule
  ]
})
export class FuelModule { }
