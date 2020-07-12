import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

import {HeaderModule} from "./header/header.module";
import {FooterComponent} from "./footer/footer.component";
import {NavigationModule} from "./navigation/navigation.module";
import {RibbonComponent} from "./ribbon/ribbon.component";
import {ShortcutComponent} from "./shortcut/shortcut.component";
import {ToggleActiveDirective} from "../utils/toggle-active.directive";
import {LayoutSwitcherComponent} from "./layout-switcher.component";
import {SearchSwitcherComponent} from "./search-switcher.component";
import { MainLayoutComponent } from './app-layouts/main-layout.component';
import { EmptyLayoutComponent } from './app-layouts/empty-layout.component';
import {RouterModule} from "@angular/router";
import { AuthLayoutComponent } from './app-layouts/auth-layout.component';
import {TooltipModule, BsDropdownModule} from "ngx-bootstrap";
import { RouteBreadcrumbsComponent } from './ribbon/route-breadcrumbs.component';
import {UtilsModule} from "../utils/utils.module";
import { PipesModule } from "../pipes/pipes.module";

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { NgbDropdown} from '@ng-bootstrap/ng-bootstrap';
import { NgScrollbarModule } from 'ngx-scrollbar';

@NgModule({
  imports: [
    CommonModule,
    HeaderModule,
    NavigationModule,
    FormsModule,
    RouterModule,

    UtilsModule,
    PipesModule,

    TooltipModule,
    BsDropdownModule,

    NgbModule,
    NgScrollbarModule
  ],
  declarations: [
    FooterComponent,
    RibbonComponent,
    ShortcutComponent,
    LayoutSwitcherComponent,
    SearchSwitcherComponent,
    MainLayoutComponent,
    EmptyLayoutComponent,
    AuthLayoutComponent,
    RouteBreadcrumbsComponent,
  ],
  exports:[
    HeaderModule,
    NavigationModule,
    FooterComponent,
    RibbonComponent,
    ShortcutComponent,
    LayoutSwitcherComponent,
    SearchSwitcherComponent,

    PipesModule
  ]
})
export class SmartadminLayoutModule{

}
