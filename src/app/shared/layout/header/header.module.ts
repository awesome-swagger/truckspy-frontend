import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgModule} from "@angular/core";

import {CollapseMenuComponent} from "./collapse-menu/collapse-menu.component";
import {FullScreenComponent} from "./full-screen/full-screen.component";
import { KeyboardShortcutsModule } from 'ng-keyboard-shortcuts';  
import { ShortcutsComponent } from "./shortcuts/shortcuts.component";

import { ActivitiesComponent } from "./activities/activities.component";
import { ActivitiesNotificationComponent } from "./activities/activities-notification/activities-notification.component";
import { HeaderComponent } from "./header.component";

import {UtilsModule} from "@app/shared/utils/utils.module";
import {PipesModule} from "@app/shared/pipes/pipes.module";
import {I18nModule} from "@app/shared/i18n/i18n.module";
import {UserModule} from "@app/shared/user/user.module";
import {VoiceControlModule} from "@app/shared/voice-control/voice-control.module";
import {BsDropdownModule, PopoverModule} from "ngx-bootstrap";
import {NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';
import {TimeAgoPipe} from 'time-ago-pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    KeyboardShortcutsModule.forRoot(),

    VoiceControlModule,

    BsDropdownModule,

    UtilsModule,PipesModule, I18nModule, UserModule, PopoverModule,
    NgbTypeaheadModule
  ],
  declarations: [
    TimeAgoPipe,
    ActivitiesNotificationComponent,
    FullScreenComponent,
    ShortcutsComponent,
    CollapseMenuComponent,
    ActivitiesComponent,
    HeaderComponent,
  ],
  exports: [
    HeaderComponent
  ]
})
export class HeaderModule{}
