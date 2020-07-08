import { ConfigActions, ConfigActionTypes } from "./config.actions";
import { Company, Dictionary } from "@app/core/services";

export interface ConfigState {
    company: Company,
    states: Dictionary;
    timezones: Dictionary;
    units: string[];
    reportends: string[];
    roles: string[];
    connectionTypes: any[];
    localTime: any;
    deviceTypes: string[];
}

export const configInitialState: ConfigState = {
    company: new Company(),
    states: new Dictionary(),
    timezones: new Dictionary(),
    units: [],
    reportends: [],
    roles: [],
    connectionTypes: [],
    localTime: {},
    deviceTypes: []
};

export function configReducer(
    state = configInitialState,
    action: ConfigActions
): ConfigState {
    switch (action.type) {
        case ConfigActionTypes.ConfigCompany:
            return {
                ...state,
                company: action.payload
            };

        case ConfigActionTypes.ConfigStates:
            return {
                ...state,
                states: action.payload
            };

        case ConfigActionTypes.ConfigTimezones:
            return {
                ...state,
                timezones: action.payload
            };

        case ConfigActionTypes.ConfigUnits:
            return {
                ...state,
                units: action.payload
            };

        case ConfigActionTypes.ConfigReportends:
            return {
                ...state,
                reportends: action.payload
            };

        case ConfigActionTypes.ConfigRoles:
            return {
                ...state,
                roles: action.payload
            };

        case ConfigActionTypes.ConfigConnectionTypes:
            return {
                ...state,
                connectionTypes: action.payload
            };

        case ConfigActionTypes.ConfigLocalTime:
            return {
                ...state,
                localTime: action.payload
            };

        case ConfigActionTypes.ConfigDeviceTypes:
            return {
                ...state,
                deviceTypes: action.payload
            };

        default:
            return state;
    }
}
