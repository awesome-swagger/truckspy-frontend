import { Routes, RouterModule } from '@angular/router';
import {DashboardComponent} from "./dashboard.component";
import {ModuleWithProviders} from "@angular/core";

export const dashboardRoutes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        data: {
            pageTitle: 'Dashboard'
        }
    }
];

export const dashboardRouting: ModuleWithProviders = RouterModule.forChild(dashboardRoutes);
