import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';

import * as fromAuth from '../store/auth';
import { User, LocalStorageService } from '../services';

// Paths common for all users (admins and regular ones)
const COMMON_PATHS = ["empty", "preferences"];

const ADMIN_DEFAULT_PATH = "admin";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private store: Store<fromAuth.AuthState>,
    private lsService: LocalStorageService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.store.pipe(
      select(fromAuth.getUser),
      map(userData => {
        if (!userData) {
          this.store.dispatch(new fromAuth.LoginRedirect('/auth/login'));
          return false;
        }

        let routePath = route.routeConfig.path;
        if (!COMMON_PATHS.includes(routePath)) {
          let currentUser: User = plainToClass(User, userData as User);
          let loginAs = this.lsService.getLoginAs();
          let theUser = !!loginAs ? loginAs : currentUser;

          if (theUser.isAdmin() && routePath !== ADMIN_DEFAULT_PATH) {
            this.store.dispatch(new fromAuth.LoginRedirect("/admin"));
            return false;
          }

          if (theUser.isUser() && routePath === ADMIN_DEFAULT_PATH) {
            this.store.dispatch(new fromAuth.LoginRedirect("/dashboard"));
            return false;
          }
        }

        return true;
      }),
      take(1)
    );
  }
}
