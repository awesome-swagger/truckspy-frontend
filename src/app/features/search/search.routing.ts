import { Routes, RouterModule } from '@angular/router';
import { SearchComponent } from "./search.component";
import { ModuleWithProviders } from "@angular/core";

export const searchRoutes: Routes = [
    {
        path: '',
        component: SearchComponent,
        data: {
            pageTitle: 'Search'
        }
    }
];

export const searchRouting: ModuleWithProviders = RouterModule.forChild(searchRoutes);
