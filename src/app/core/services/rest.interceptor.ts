import { TOKEN_INTERCEPTOR_HEADER } from '@app/core/smartadmin.config';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { Store } from '@ngrx/store';

import * as fromAuth from '../store/auth';
import { catchError } from 'rxjs/operators';
import { LocalStorageService } from './rest.service';

@Injectable()
export class RestInterceptor implements HttpInterceptor {

    constructor(
        public store: Store<fromAuth.AuthState>,
        private lsService: LocalStorageService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let doIntercept: boolean = request.headers.get(TOKEN_INTERCEPTOR_HEADER) ? true : false;
        if (doIntercept) {
            return this.handleApiRequest(request, next);
        } else {
            return next.handle(request);
        }
    }

    handleApiRequest(request: HttpRequest<any>, next: HttpHandler) {
        let apiKey = this.lsService.getApiKey();
        let headers = {
            "X-Auth-Token": apiKey
        }
        let loginAs = this.lsService.getLoginAs();
        if (loginAs) {
            headers["X-Auth-AsUser"] = loginAs.username;
        }

        request = apiKey
            ? request.clone({
                setHeaders: headers
            })
            : request;

        const handler = next.handle(request).pipe(
            catchError((error, caught) => {
                if (error.status === 401) {
                    this.store.dispatch(new fromAuth.LogoutAction());
                }
                console.log(error)
                return throwError(error);
            })
        );

        return handler;
    }
}
