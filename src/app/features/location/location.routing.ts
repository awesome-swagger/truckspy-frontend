import { Routes, RouterModule } from '@angular/router';
import { LocationsComponent } from "./locations/locations.component";
import { LocationsListComponent } from "./list/locations-list.component";
import { LocationViewComponent } from './list/view/location-view.component';
import { GroupsComponent } from './groups/groups.component';
import { ModuleWithProviders } from "@angular/core";

export const locationRoutes: Routes = [
    {
        path: 'groups',
        component: GroupsComponent,
        data: {
            pageTitle: 'Groups'
        }
    },
    {
        path: 'locations',
        component: LocationsComponent,
        data: {
            pageTitle: 'Locations Map'
        }
    },
    {
        path: 'list',
        component: LocationsListComponent,
        data: {
            pageTitle: 'Locations List'
        }
    },
    {
        path: 'list/:id/view',
        component: LocationViewComponent,
        data: {
            pageTitle: 'Location Details'
        }
    }
];

export const locationRouting: ModuleWithProviders = RouterModule.forChild(locationRoutes);
