import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { companyRouting } from './company.routing';
import { CompanyComponent } from './company.component';
import { CompanyInfoComponent } from './company-info/company-info.component';
import { CompanyUsersComponent } from './company-users/company-users.component';
import { CompanyConnectionsComponent } from './company-connections/company-connections.component';
import { ConnectionViewComponent } from './company-connections/view/connection-view.component';
import { CompanyDispatchGroupsComponent } from './company-dispatchgroups/company-dispatchgroups.component';
import { CompanyVehicleTypesComponent } from './company-vehicletypes/company-vehicletypes.component';
import { CompanyFeedbackTypesComponent } from './company-feedbacktypes/company-feedbacktypes.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { Module as StripeModule } from "stripe-angular"

@NgModule({
  declarations: [
    CompanyComponent,
    CompanyInfoComponent,
    CompanyUsersComponent,
    CompanyConnectionsComponent,
    ConnectionViewComponent,
    CompanyDispatchGroupsComponent,
    CompanyVehicleTypesComponent,
    CompanyFeedbackTypesComponent,
    InvoicesComponent
  ],
  providers: [
    DecimalPipe
  ],
  imports: [
    CommonModule,
    companyRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule,
    StripeModule.forRoot()
  ]
})
export class CompanyModule { }
