import { Routes, RouterModule } from '@angular/router';
import { PreferencesComponent } from "./preferences.component";
import { ModuleWithProviders } from "@angular/core";

export const preferencesRoutes: Routes = [
    {
        path: '',
        component: PreferencesComponent,
        data: {
            pageTitle: 'User Preferences'
        }
    }
];

export const preferencesRouting: ModuleWithProviders = RouterModule.forChild(preferencesRoutes);
