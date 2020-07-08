import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { searchRouting } from './search.routing';
import { SearchComponent } from './search.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';

@NgModule({
  declarations: [SearchComponent],
  imports: [
    CommonModule,
    searchRouting,
    SmartadminDatatableModule,
    SharedModule
  ]
})
export class SearchModule { }
