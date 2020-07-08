import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { DispatchComponent } from "./dispatch.component";

export const dispatchRoutes: Routes = [
    {
        path: '',
        component: DispatchComponent,
        data: {
            pageTitle: 'Dispatch'
        }
    }
];

export const dispatchRouting: ModuleWithProviders = RouterModule.forChild(dispatchRoutes);
