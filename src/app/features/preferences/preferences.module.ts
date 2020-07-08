import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { preferencesRouting } from './preferences.routing';
import { PreferencesComponent } from './preferences.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  declarations: [PreferencesComponent, NotificationSettingsComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    preferencesRouting,
    SharedModule
  ]
})
export class PreferencesModule { }
