import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { DriversComponent } from "./drivers.component";
import { DriverViewComponent } from './view/driver-view.component';

export const driversRoutes: Routes = [
    {
        path: '',
        component: DriversComponent,
        data: {
            pageTitle: 'Drivers'
        }
    },
    {
        path: ':id/view',
        component: DriverViewComponent,
        data: {
            pageTitle: 'Driver Details'
        }
    }
];

export const driversRouting: ModuleWithProviders = RouterModule.forChild(driversRoutes);
