import { Component, OnInit } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';

import { LayoutService } from '@app/core/services/layout.service';
import { ProfileState, getProfileModel } from '@app/core/store/profile';
import { Profile, createProfile } from '@app/core/store/profile/profile.model';
import { LocalStorageService } from '@app/core/services';
import { LoggedInAs, LoggedOutAs } from '@app/core/store/auth';

const defaultUser = {
  name: "",
  pic: "assets/img/avatars/sunny.png"
};

@Component({
  selector: 'sa-login-info',
  templateUrl: './login-info.component.html',
})
export class LoginInfoComponent implements OnInit {

  loggedInAsProfile: Profile;
  user = defaultUser;
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
    private layoutService: LayoutService,
    private store: Store<ProfileState>,
    private lsService: LocalStorageService) { }

  ngOnInit() {
    let loggedInAs = this.lsService.getLoginAs();
    this.loggedInAsProfile = !!loggedInAs ? createProfile(loggedInAs) : null;
    this.store.select(getProfileModel).subscribe((profile: Profile) => this.user = profile);
  }

  toggleShortcut() {
    this.layoutService.onShortcutToggle()
  }

}
