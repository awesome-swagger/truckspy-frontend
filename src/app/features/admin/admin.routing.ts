import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";

import { CompaniesComponent } from "./companies/companies.component";
import { AdminCompanyComponent } from './companies/view/company.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { SystemComponent } from './system/system.component';
import { BillingComponent } from './billing/billing.component';

export const adminRoutes: Routes = [
    {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
            pageTitle: 'Dashboard'
        }
    },
    {
        path: 'companies',
        component: CompaniesComponent,
        data: {
            pageTitle: 'Companies'
        }
    },
    {
        path: 'companies/:id/view',
        component: AdminCompanyComponent,
        data: {
            pageTitle: 'Company Details'
        }
    },
    {
        path: 'users',
        component: UsersComponent,
        data: {
            pageTitle: 'Users'
        }
    },
    {
        path: 'system',
        component: SystemComponent,
        data: {
            pageTitle: 'System'
        }
    },
    {
        path: 'billing',
        component: BillingComponent,
        data: {
            pageTitle: 'Billing'
        }
    }
];

export const adminRouting: ModuleWithProviders = RouterModule.forChild(adminRoutes);
