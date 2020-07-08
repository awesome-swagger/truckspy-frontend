import { createSelector, createFeatureSelector } from '@ngrx/store';
import { plainToClass } from "class-transformer";

import * as fromConfig from './config.reducer'
import { ConnectionType } from '@app/core/services/rest.model';

export const getConfigState = createFeatureSelector<fromConfig.ConfigState>('config')

export const getConfigCompany = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.company)
export const getConfigStates = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.states)
export const getConfigStatesKeyValues = createSelector(getConfigState, (state: fromConfig.ConfigState) => {
    let result = [];
    Object.keys(state.states).forEach(key => {
        let value = state.states[key];
        result.push({
            "key": key,
            "value": value
        });
    });
    return result;
})

export const getConfigTimezones = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.timezones)
export const getConfigTimezonesKeys = createSelector(getConfigState, (state: fromConfig.ConfigState) => {
    let result: string[] = [];
    Object.keys(state.timezones).forEach(key => {
        result.push(key)
    });
    return result;
})

export const getConfigUnits = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.units)
export const getConfigReportends = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.reportends)
export const getConfigRoles = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.roles)

export const getConfigConnectionTypes = createSelector(getConfigState, (state: fromConfig.ConfigState) => {
    return plainToClass(ConnectionType, state.connectionTypes);
})
export const getConfigConnectionTypesFlat = createSelector(getConfigState, (state: fromConfig.ConfigState) => {
    let result: string[] = [];
    state.connectionTypes.forEach((typeObject: any) => {
        result.push(typeObject.type)
    });
    return result;
})

export const getConfigLocalTime = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.localTime)

export const getConfigDeviceTypes = createSelector(getConfigState, (state: fromConfig.ConfigState) => state.deviceTypes)
