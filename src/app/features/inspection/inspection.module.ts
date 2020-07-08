import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { inspectionRouting } from './inspection.routing';
import { ConfigurationComponent } from './configuration/configuration.component';
import { ConfigurationViewComponent } from './configuration/view/configuration-view.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { OnOffSwitchModule } from '../../shared/forms/input/on-off-switch/on-off-switch.module';
import { NgDragDropModule } from 'ng-drag-drop';
import { NgHighlightModule } from 'ngx-text-highlight';

@NgModule({
  declarations: [ConfigurationComponent, ConfigurationViewComponent],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    CommonModule,
    inspectionRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule,
    OnOffSwitchModule,
    NgHighlightModule,
    NgDragDropModule.forRoot()
  ]
})
export class InspectionModule { }
