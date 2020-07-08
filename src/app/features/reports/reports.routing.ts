import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { ReportsComponent } from "./reports.component";

export const reportsRoutes: Routes = [
    {
        path: '',
        component: ReportsComponent,
        data: {
            pageTitle: 'Reports'
        }
    }
];

export const reportsRouting: ModuleWithProviders = RouterModule.forChild(reportsRoutes);
