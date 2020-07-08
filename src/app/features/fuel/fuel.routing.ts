import { Routes, RouterModule } from '@angular/router';
import {FuelComponent} from "./fuel.component";
import {ModuleWithProviders} from "@angular/core";

export const fuelRoutes: Routes = [
    {
        path: '',
        component: FuelComponent,
        data: {
            pageTitle: 'Fuel'
        }
    }
];

export const fuelRouting: ModuleWithProviders = RouterModule.forChild(fuelRoutes);
