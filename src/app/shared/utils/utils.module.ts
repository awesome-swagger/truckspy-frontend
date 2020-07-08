import { NgModule } from "@angular/core";
import { ToggleActiveDirective } from "./toggle-active.directive";
import { VarDirective } from "./ng-var.directive";

@NgModule({
  declarations: [ToggleActiveDirective, VarDirective],
  exports: [ToggleActiveDirective, VarDirective]
})
export class UtilsModule {}
