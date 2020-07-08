import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { Store } from '@ngrx/store';
import { LocalStorageService, RestService } from '@app/core/services'

import * as fromAuth from '@app/core/store/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../auth.component.css']
})
export class LoginComponent implements OnInit {

  email: string = "";
  password: string = "";

  // email: string = "admin";
  // password: string = "easypassword";

  // email: string = "f.holbrook@gmail.com";
  // password: string = "easypassword";

  // email: string = "flint@goliadequity.com";
  // password: string = "Flint29710!";
  errorMessage: string = null;

  constructor(
    private router: Router,
    private lsService: LocalStorageService,
    private restService: RestService,
    private store: Store<fromAuth.AuthState>) { }

  ngOnInit() {
  }

  login() {
    this.errorMessage = null;

    this.restService.doLogin(this.email, this.password)
      .subscribe(
        authInfo => {
          console.log("Logged in successfully");
          this.lsService.storeApiKey(authInfo.apiKey);
          let user = authInfo.user;
          this.store.dispatch(new fromAuth.AuthTokenPayload(user));
          this.store.dispatch(new fromAuth.AppInit(user.isAdmin()));
          let home = user.getEntryPoint();
          this.router.navigate([home]);
        },
        error => {
          this.errorMessage = error;
        },
        () => console.log('the login api call is done!')
      );
  }

}
