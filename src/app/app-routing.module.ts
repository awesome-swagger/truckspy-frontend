import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { MainLayoutComponent } from "./shared/layout/app-layouts/main-layout.component";
import { AuthLayoutComponent } from "./shared/layout/app-layouts/auth-layout.component";
import { AuthGuard } from "./core/guards/auth.guard";

const routes: Routes = [
  {
    path: "",
    component: MainLayoutComponent,
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
      },
      {
        path: "empty",
        loadChildren: "./features/empty/empty.module#EmptyModule",
        canActivate: [AuthGuard]
      },
      // {
      //   path: "search",
      //   loadChildren: "./features/search/search.module#SearchModule",
      //   canActivate: [AuthGuard]
      // },
      {
        path: "dashboard",
        loadChildren: "./features/dashboard/dashboard.module#DashboardModule",
        canActivate: [AuthGuard]
      },
      {
        path: "vehicles",
        loadChildren: "./features/vehicles/vehicles.module#VehiclesModule",
        canActivate: [AuthGuard]
      },
      {
        path: "inspection",
        loadChildren: "./features/inspection/inspection.module#InspectionModule",
        canActivate: [AuthGuard]
      },
      {
        path: "drivers",
        loadChildren: "./features/drivers/drivers.module#DriversModule",
        canActivate: [AuthGuard]
      },
      {
        path: "messages",
        loadChildren: "./features/messages/messages.module#MessagesModule",
        canActivate: [AuthGuard]
      },
      {
        path: "location",
        loadChildren: "./features/location/location.module#LocationModule",
        canActivate: [AuthGuard]
      },
      {
        path: "devices",
        loadChildren: "./features/devices/devices.module#DevicesModule",
        canActivate: [AuthGuard]
      },
      {
        path: "fuel",
        loadChildren: "./features/fuel/fuel.module#FuelModule",
        canActivate: [AuthGuard]
      },
      {
        path: "reporting",
        loadChildren: "./features/reporting/reporting.module#ReportingModule",
        canActivate: [AuthGuard]
      },
      {
        path: "reports",
        loadChildren: "./features/reports/reports.module#ReportsModule",
        canActivate: [AuthGuard]
      },
      {
        path: "dispatch",
        loadChildren: "./features/dispatch/dispatch.module#DispatchModule",
        canActivate: [AuthGuard]
      },
      {
        path: "bookings",
        loadChildren: "./features/bookings/bookings.module#BookingsModule",
        canActivate: [AuthGuard]
      },
      {
        path: "customers",
        loadChildren: "./features/customers/customers.module#CustomersModule",
        canActivate: [AuthGuard]
      },
      {
        path: "company",
        loadChildren: "./features/company/company.module#CompanyModule",
        canActivate: [AuthGuard]
      },
      {
        path: "preferences",
        loadChildren: "./features/preferences/preferences.module#PreferencesModule",
        canActivate: [AuthGuard]
      },
      {
        path: "admin",
        loadChildren: "./features/admin/admin.module#AdminModule",
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: "auth",
    component: AuthLayoutComponent,
    loadChildren: "./features/auth/auth.module#AuthModule"
  },
  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
