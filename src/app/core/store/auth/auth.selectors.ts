import * as fromAuth from './auth.reducer'
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { plainToClass } from 'class-transformer';
import { User } from '@app/core/services/rest.model';

export const getAuthState = createFeatureSelector<fromAuth.AuthState>('auth')

export const getAuthLoading = createSelector(getAuthState, (state: fromAuth.AuthState) => state.loading)
export const getAuthError = createSelector(getAuthState, (state: fromAuth.AuthState) => state.error)
export const getUser = createSelector(getAuthState, (state: fromAuth.AuthState) => state.user)
export const getTableLength = createSelector(getAuthState, (state: fromAuth.AuthState) => {
    if (!!state.user) {
        let user: User = plainToClass(User, state.user as User);
        return user.getTableLength();
    }
    return 1;
})

export const getLoggedIn = createSelector(getAuthState, (state: fromAuth.AuthState) => !!state.user)
