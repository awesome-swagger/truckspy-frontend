import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DateTimeWidgetComponent} from './date-time-widget.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {OwlDateTimeModule} from "ng-pick-datetime";
import {NgxMaskModule} from "ngx-mask";

@NgModule({
  declarations: [DateTimeWidgetComponent],
  exports: [
    DateTimeWidgetComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    OwlDateTimeModule,
    NgxMaskModule.forRoot(),
    ReactiveFormsModule
  ]
})
export class DateTimeWidgetModule { }
