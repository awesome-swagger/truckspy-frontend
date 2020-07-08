import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "switch",
  styleUrls: ["./switch.component.css"],
  template: `
    <div class="switch" [class.checked]="checked" (click)="toggle()"></div>
  `,
})
export class SwitchComponent {
  @Input() checked: boolean;
  @Output() changed = new EventEmitter<boolean>();

  toggle() {
    this.changed.emit(!this.checked);
  }
}
