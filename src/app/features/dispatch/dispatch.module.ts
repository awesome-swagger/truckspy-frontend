import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { dispatchRouting } from './dispatch.routing';
import { DispatchComponent } from './dispatch.component';
import { TripAuditModalComponent } from './trip-audit/trip-audit-modal.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { NgDragDropModule } from 'ng-drag-drop';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';
import { NgHighlightModule } from 'ngx-text-highlight';

@NgModule({
  declarations: [DispatchComponent, TripAuditModalComponent],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    CommonModule,
    dispatchRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule,
    Select2Module,
    NgHighlightModule,
    NgDragDropModule.forRoot()
  ]
})
export class DispatchModule { }
