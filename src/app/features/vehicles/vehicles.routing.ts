import { Routes, RouterModule } from '@angular/router';
import { VehiclesComponent } from "./vehicles.component";
import { ModuleWithProviders } from "@angular/core";
import { VehicleViewComponent } from './view/vehicle-view.component';
import { DataViewComponent } from './dataview/dataview.component';

export const vehiclesRoutes: Routes = [
    {
        path: '',
        component: VehiclesComponent,
        data: {
            pageTitle: 'Vehicles'
        }
    },
    {
        path: ':id/view',
        component: VehicleViewComponent,
        data: {
            pageTitle: 'Vehicle Details'
        }
    },
    {
        path: ':id/dataview',
        component: DataViewComponent,
        data: {
            pageTitle: 'Data View'
        }
    }
];

export const vehiclesRouting: ModuleWithProviders = RouterModule.forChild(vehiclesRoutes);
