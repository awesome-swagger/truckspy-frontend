import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { BookingsComponent } from "./bookings.component";
import { BookingViewComponent } from './view/booking-view.component';

export const bookingsRoutes: Routes = [
    {
        path: '',
        component: BookingsComponent,
        data: {
            pageTitle: 'Bookings'
        }
    },
    {
        path: ':id/view',
        component: BookingViewComponent,
        data: {
            pageTitle: 'Booking Details'
        }
    }
];

export const bookingsRouting: ModuleWithProviders = RouterModule.forChild(bookingsRoutes);
