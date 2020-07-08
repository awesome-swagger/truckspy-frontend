import { Injectable } from '@angular/core';

import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { tap, filter, switchMap, map } from 'rxjs/operators';

import { AuthActionTypes } from '@app/core/store/auth';
import { RestService, Company } from '@app/core/services';
import { ConfigState } from './config.reducer';
import * as actions from './config.actions';

@Injectable()
export class ConfigEffects {

  @Effect({ dispatch: false })
  localTimeConfigInit$ = this.actions$.pipe(
    ofType(AuthActionTypes.AuthTokenPayload),
    tap((data: any) => {
      let user = data.payload;
      if (user && user.timezone) {
        this.restService.getConfigLocalTime(user.timezone)
          .subscribe(
            data => {
              this.store.dispatch(new actions.ConfigLocalTime(data))
            }
          );
      }
    })
  );

  @Effect({ dispatch: false })
  configInit$ = this.actions$.pipe(
    ofType(AuthActionTypes.AppInit),
    tap((data: any) => {
      if (!data.isAdmin) {
        this.restService.getCompany()
          .subscribe(
            data => {
              this.store.dispatch(new actions.ConfigCompany(data))
            }
          );
      } else {
        this.store.dispatch(new actions.ConfigCompany(new Company()))
      }

      this.restService.getConfigReportends()
        .subscribe(
          data => {
            this.store.dispatch(new actions.ConfigReportends(data))
          }
        );

      this.restService.getConfigRoles()
        .subscribe(
          data => {
            this.store.dispatch(new actions.ConfigRoles(data))
          }
        );

      this.restService.getConfigUnits()
        .subscribe(
          data => {
            this.store.dispatch(new actions.ConfigUnits(data))
          }
        );

      this.restService.getConfigStates()
        .subscribe(
          data => {
            this.store.dispatch(new actions.ConfigStates(data))
          }
        );

      this.restService.getConfigTimezones()
        .subscribe(
          data => {
            this.store.dispatch(new actions.ConfigTimezones(data))
          }
        );

      this.restService.getConfigConnectionTypes()
        .subscribe(
          data => {
            this.store.dispatch(new actions.ConfigConnectionTypes(data))
          }
        );

      this.restService.getDeviceTypes()
        .subscribe(
          data => {
            this.store.dispatch(new actions.ConfigDeviceTypes(data))
          }
        );

    })
  );

  constructor(private actions$: Actions,
    private store: Store<ConfigState>,
    private restService: RestService) { }

}
