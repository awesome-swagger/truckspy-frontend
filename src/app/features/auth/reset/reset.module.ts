import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResetRoutingModule } from './reset-routing.module';
import { ResetComponent } from './reset.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    ResetRoutingModule,
    FormsModule
  ],
  declarations: [ResetComponent]
})
export class ResetModule { }
