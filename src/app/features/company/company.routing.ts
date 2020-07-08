import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { CompanyComponent } from "./company.component";
import { ConnectionViewComponent } from './company-connections/view/connection-view.component';
import { InvoicesComponent } from './invoices/invoices.component';

export const companyRoutes: Routes = [
    {
        path: '',
        component: CompanyComponent,
        data: {
            pageTitle: 'Company'
        }
    },
    {
        path: 'connections/:id/view',
        component: ConnectionViewComponent,
        data: {
            pageTitle: 'Connection Details'
        }
    },
    {
        path: 'invoices',
        component: InvoicesComponent,
        data: {
            pageTitle: 'Invoices'
        }
    }
];

export const companyRouting: ModuleWithProviders = RouterModule.forChild(companyRoutes);
