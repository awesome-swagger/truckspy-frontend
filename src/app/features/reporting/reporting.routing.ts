import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { ReportingComponent } from "./reporting.component";
import { ReportingViewComponent } from './view/reporting-view.component';

export const reportingRoutes: Routes = [
    {
        path: '',
        component: ReportingComponent,
        data: {
            pageTitle: 'Reporting Profiles'
        }
    },
    {
        path: ':id/view',
        component: ReportingViewComponent,
        data: {
            pageTitle: 'Reporting Profile Details'
        }
    }
];

export const reportingRouting: ModuleWithProviders = RouterModule.forChild(reportingRoutes);
