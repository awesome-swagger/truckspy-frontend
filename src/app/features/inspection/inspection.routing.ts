import { Routes, RouterModule } from '@angular/router';
import { ConfigurationComponent } from './configuration/configuration.component';
import { ConfigurationViewComponent } from './configuration/view/configuration-view.component';
import { ModuleWithProviders } from "@angular/core";

export const inspectionRoutes: Routes = [
    {
        path: 'configuration',
        component: ConfigurationComponent,
        data: {
            pageTitle: 'Configuration'
        }
    },
    {
        path: 'configurations/:id/view',
        component: ConfigurationViewComponent,
        data: {
            pageTitle: 'Configuration Details'
        }
    }
];

export const inspectionRouting: ModuleWithProviders = RouterModule.forChild(inspectionRoutes);
