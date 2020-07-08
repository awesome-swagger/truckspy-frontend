import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { DevicesComponent } from "./devices.component";
import { DeviceViewComponent } from './view/device-view.component';

export const devicesRoutes: Routes = [
    {
        path: '',
        component: DevicesComponent,
        data: {
            pageTitle: 'Devices'
        }
    },
    {
        path: ':id/view',
        component: DeviceViewComponent,
        data: {
            pageTitle: 'Device Details'
        }
    }
];

export const devicesRouting: ModuleWithProviders = RouterModule.forChild(devicesRoutes);
