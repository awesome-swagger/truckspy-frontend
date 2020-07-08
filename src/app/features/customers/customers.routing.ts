import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { CustomersComponent } from "./customers.component";
import { CustomerViewComponent } from './view/customer-view.component';

export const customersRoutes: Routes = [
    {
        path: '',
        component: CustomersComponent,
        data: {
            pageTitle: 'Customers'
        }
    },
    {
        path: ':id/view',
        component: CustomerViewComponent,
        data: {
            pageTitle: 'Customer Details'
        }
    }
];

export const customersRouting: ModuleWithProviders = RouterModule.forChild(customersRoutes);
