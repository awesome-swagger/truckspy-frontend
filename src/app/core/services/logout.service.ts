import { Injectable } from '@angular/core';
import { Router } from "@angular/router";
import { NotificationService } from "@app/core/services/notification.service";

import { ProfileState } from "@app/core/store/profile";
import { Store } from "@ngrx/store";
import { LogoutAction } from "@app/core/store/auth";
import { RestService } from './rest.service';

@Injectable()
export class LogoutService {

    constructor(
        private router: Router,
        private store: Store<ProfileState>,
        private restService: RestService,
        private notificationService: NotificationService) { }

    public showPopup(name: string) {
        this.notificationService.smartMessageBox(
            {
                title:
                    "<i class='fa fa-sign-out txt-color-orangeDark'></i> Logout <span class='txt-color-orangeDark'><strong>" + name + "</strong></span> ?",
                content:
                    "You can improve your security further after logging out by closing this opened browser",
                buttons: "[No][Yes]"
            },
            ButtonPressed => {
                if (ButtonPressed == "Yes") {
                    this.logout();
                }
            }
        );
    }

    public logout() {
        this.restService.doLogout();
        this.store.dispatch(new LogoutAction());
        this.router.navigate(["/auth/login"]);
    }

}
