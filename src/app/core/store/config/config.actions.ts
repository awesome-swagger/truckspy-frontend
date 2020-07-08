import { Action } from "@ngrx/store";

export enum ConfigActionTypes {
  ConfigCompany = "[Config] Company",
  ConfigStates = "[Config] States",
  ConfigTimezones = "[Config] Timezones",
  ConfigUnits = "[Config] Units",
  ConfigReportends = "[Config] Reportends",
  ConfigRoles = "[Config] Roles",
  ConfigConnectionTypes = "[Config] ConnectionTypes",
  ConfigLocalTime = "[Config] LocalTime",
  ConfigDeviceTypes = "[Config] DeviceTypes"
}

export class ConfigCompany implements Action {
  readonly type = ConfigActionTypes.ConfigCompany;
  constructor(readonly payload: any) { }
}

export class ConfigStates implements Action {
  readonly type = ConfigActionTypes.ConfigStates;
  constructor(readonly payload: any) { }
}

export class ConfigTimezones implements Action {
  readonly type = ConfigActionTypes.ConfigTimezones;
  constructor(readonly payload: any) { }
}

export class ConfigUnits implements Action {
  readonly type = ConfigActionTypes.ConfigUnits;
  constructor(readonly payload: any) { }
}

export class ConfigReportends implements Action {
  readonly type = ConfigActionTypes.ConfigReportends;
  constructor(readonly payload: any) { }
}

export class ConfigRoles implements Action {
  readonly type = ConfigActionTypes.ConfigRoles;
  constructor(readonly payload: any) { }
}

export class ConfigConnectionTypes implements Action {
  readonly type = ConfigActionTypes.ConfigConnectionTypes;
  constructor(readonly payload: any) { }
}

export class ConfigLocalTime implements Action {
  readonly type = ConfigActionTypes.ConfigLocalTime;
  constructor(readonly payload: any) { }
}

export class ConfigDeviceTypes implements Action {
  readonly type = ConfigActionTypes.ConfigDeviceTypes;
  constructor(readonly payload: any) { }
}

export type ConfigActions =
  | ConfigCompany
  | ConfigStates
  | ConfigTimezones
  | ConfigUnits
  | ConfigReportends
  | ConfigRoles
  | ConfigConnectionTypes
  | ConfigLocalTime
  | ConfigDeviceTypes;
