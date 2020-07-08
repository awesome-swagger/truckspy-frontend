import { Component, OnInit } from "@angular/core";
import { Actions } from "@ngrx/effects";
import { Store, select } from "@ngrx/store";
import { take } from "rxjs/operators";

import { LogoutService, LocalStorageService } from "@app/core/services";
import { ProfileState, getProfileModel } from "@app/core/store/profile";
import { LoggedInAs, LoggedOutAs } from "@app/core/store/auth";
import { createProfile } from "@app/core/store/profile/profile.model";

@Component({
  selector: "sa-logout",
  template: `<div id="logout" class="btn-header transparent pull-right">
        <span> <a (click)="showPopup()" title="Sign Out"><i class="fa fa-sign-out"></i></a> </span>
    </div>
  `,
  styles: []
})
export class LogoutComponent implements OnInit {

  private loggedInAsProfile;
  private user;
  theUser() {
    return !!this.loggedInAsProfile ? this.loggedInAsProfile : this.user;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loggedInAsProfile = createProfile(this.lsService.getLoginAs());
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loggedInAsProfile = null;
    }
  });

  constructor(
    private actions$: Actions,
    private logoutService: LogoutService,
    private store: Store<ProfileState>,
    private lsService: LocalStorageService) { }

  showPopup() {
    this.logoutService.showPopup(this.theUser().name);
  }

  ngOnInit() {
    // Need to take logged-in-as user if specified
    let loggedInAs = this.lsService.getLoginAs();
    this.loggedInAsProfile = !!loggedInAs ? createProfile(loggedInAs) : null;
    this.store.pipe(select(getProfileModel), take(1)).subscribe(val => this.user = val);
  }
}
