import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet><ngx-loading-bar [includeSpinner]="false" color="#999"></ngx-loading-bar>',
})
export class AppComponent {
  title = 'sa';
}
