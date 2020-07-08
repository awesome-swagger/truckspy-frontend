import { ModuleWithProviders } from "@angular/core"
import { Routes, RouterModule } from "@angular/router";

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: './login/login.module#LoginModule'
  },
  {
    path: 'forgot-password',
    loadChildren: './forgot/forgot.module#ForgotModule'
  },
  {
    path: 'reset-password',
    loadChildren: './reset/reset.module#ResetModule'
  }
];

export const routing = RouterModule.forChild(routes);
