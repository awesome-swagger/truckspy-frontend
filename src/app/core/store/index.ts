import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer,
  Action
} from "@ngrx/store";

import { localStorageSync } from 'ngrx-store-localstorage';

import { environment } from "../../../environments/environment";

import * as auth from "./auth";
import * as config from "./config";
import * as notify from "./notify";
import * as profile from "./profile";
import * as layout from "./layout";
import * as calendar from "./calendar";
import * as shortcuts from "./shortcuts";

export interface AppState {
  auth: auth.AuthState;
  config: config.ConfigState,
  notify: notify.NotifyState;
  profile: profile.ProfileState;
  layout: layout.LayoutState;
  calendar: calendar.CalendarState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: auth.authReducer,
  config: config.configReducer,
  notify: notify.notifyReducer,
  profile: profile.profileReducer,
  layout: layout.layoutReducer,
  calendar: calendar.calendarReducer,
};

// console.log all actions
export function logger(
  reducer: ActionReducer<AppState>
): ActionReducer<AppState> {
  return function(state: AppState, action: any): AppState {
    if (
      // !action.silent &&
      environment.log.store
    ) {
      // console.log("\nstate", state);
      // console.log("+ action", action);
    }

    return reducer(state, action);
  };
}

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return localStorageSync({
    keys: ['auth', 'config', 'notify', 'profile', 'layout', 'calendar'],
    rehydrate: true
  })(reducer);
}

export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [logger, localStorageSyncReducer]
  : [localStorageSyncReducer];

export const effects = [
  auth.AuthEffects,
  config.ConfigEffects,
  notify.NotifyEffects,
  profile.ProfileEffects,
  layout.LayoutEffects,
  calendar.CalendarEffects,
];

export const services = [notify.NotifyService];
