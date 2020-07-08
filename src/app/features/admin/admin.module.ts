import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { QRCodeModule } from 'angularx-qrcode';
import { adminRouting } from './admin.routing';
import { CompaniesComponent } from './companies/companies.component';
import { AdminCompanyComponent } from './companies/view/company.component';
import { AdminInvoicesComponent } from './companies/view/invoices/invoices.component';
import { AdminDiscountsComponent } from './companies/view/discounts/discounts.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { SystemComponent } from './system/system.component';
import { BillingComponent } from './billing/billing.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';

import { NgxMaskModule, IConfig } from 'ngx-mask'
export const maskOptions: Partial<IConfig> | (() => Partial<IConfig>) = {};

@NgModule({
  declarations: [DashboardComponent, CompaniesComponent, AdminCompanyComponent, AdminInvoicesComponent,
    AdminDiscountsComponent, UsersComponent, SystemComponent, BillingComponent],
  providers: [TitleCasePipe],
  imports: [
    NgSelectModule,
    QRCodeModule,
    CommonModule,
    adminRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule,
    NgxMaskModule.forRoot(maskOptions)
  ]
})
export class AdminModule { }
