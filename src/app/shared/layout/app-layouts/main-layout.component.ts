import { Component, OnInit } from "@angular/core";
import { routerTransition } from "@app/shared/utils/animations";

import { Store } from '@ngrx/store';
import { AuthState, getUser } from '@app/core/store/auth';
import { plainToClass } from 'class-transformer';
import { User } from '@app/core/services/rest.model';

@Component({
  selector: "app-main-layout",
  templateUrl: "./main-layout.component.html",
  styles: [],
  animations: [routerTransition]
})
export class MainLayoutComponent implements OnInit {
  user: User;

  constructor(
    private store: Store<AuthState> ) {}

  ngOnInit() {
    this.store.select(getUser).subscribe((user: any) => {
      this.user = plainToClass(User, user as User);
    });
  }

  getState(outlet) {
    if(!outlet.activatedRoute) return;
    let ss = outlet.activatedRoute.snapshot;

    // return unique string that is used as state identifier in router animation
    return (
      outlet.activatedRouteData.state ||
      (ss.url.length
        ? ss.url[0].path
        : ss.parent.url.length
          ? ss.parent.url[0].path
          : null)
    );
  }
}
