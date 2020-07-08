import { Component, OnInit } from '@angular/core';
import { plainToClass } from "class-transformer";
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';

import { LoggedInAs, AuthState, getUser, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';
import { User, LocalStorageService, Company } from '@app/core/services';

@Component({
  selector: 'sa-navigation',
  templateUrl: './navigation.component.html'
})
export class NavigationComponent implements OnInit {

  user: User;
  loggedInAs: User;
  theUser() {
    return !!this.loggedInAs ? this.loggedInAs : this.user;
  }

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loggedInAs = this.lsService.getLoginAs();
      this.loginAsCompany = this.lsService.getCompany();
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loggedInAs = null;
      this.loginAsCompany = null;
    }
  });

  constructor(
    private actions$: Actions,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) { }

  ngOnInit() {
    this.loggedInAs = this.lsService.getLoginAs();
    this.store.select(getUser).subscribe((user: any) => {
      this.user = plainToClass(User, user as User);
    });
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();
  }

}
