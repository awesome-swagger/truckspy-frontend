import {Component, OnInit, TemplateRef} from '@angular/core';
import {select, Store} from "@ngrx/store";
import {Actions} from '@ngrx/effects';
import {take} from "rxjs/operators";
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';

import {Attribute, Company, LocalStorageService, RestService, User} from '@app/core/services'
import {getProfileModel, ProfileState} from "@app/core/store/profile";
import {getConfigCompany, getConfigTimezonesKeys} from "@app/core/store/config";

import * as fromAuth from '@app/core/store/auth';
import {DATETIME_DISPLAY_ATTRIBUTE, ENTRY_POINT_ATTRIBUTE, TABLE_LENGTH_ATTRIBUTE} from '@app/core/smartadmin.config';
import {ExitEditMode} from '@app/core/store/shortcuts';
import {DateTimePreference} from "@app/core/services/date-time-preference.model";

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.css']
})
export class PreferencesComponent implements OnInit {

  private userId: string;
  user: User;
  timezones: string[];
  edit: boolean = false;
  profileData = {};
  // Defines if himself or loggedInAs
  himself: boolean;
  company: Company;
  private dateTimePreference: DateTimePreference;

  beginEdit() {
    this.profileData = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phone: this.user.phone,
      timezone: this.user.timezone
    };
    this.edit = true;
  }
  cancelEdit() {
    this.edit = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEdit();
      this.cancelEditPreferences();
    }
  });

  save() {
    this.restService.updateUser(this.userId, this.profileData)
      .subscribe(
        data => {
          this.user = data;
          if (this.himself) {
            this.store.dispatch(new fromAuth.AuthTokenPayload(data));
          } else {
            this.lsService.storeLoginAsInfo(data, this.company);
            this.store.dispatch(new fromAuth.LoggedInAs());
          }
          this.edit = false;
        }
      );
  }

  /**
   * Preferences edit functionality.
   */
  editPreferences: boolean = false;
  preferencesData = {};
  tableLengths: number[] = [25, 50, 75, 100];
  // entryPoints: string[] = ["/dashboard", "/admin/dashboard", "/messages"];
  entryPointsMap = {
    "/dashboard": "Dashboard",
    "/admin/dashboard": "Dashboard",
    "/messages": "Messages"
  };

  beginEditPreferences() {
    this.preferencesData = {
      tableLength: this.user.getTableLength(),
      entryPoint: this.user.getEntryPoint(),
      datetime: this.dateTimePreference.getUserPreference().value,
    };
    this.editPreferences = true;
  }
  cancelEditPreferences() {
    this.editPreferences = false;
  }
  savePreferences() {
    this.restService.updateUserAttributes(
      new Attribute(TABLE_LENGTH_ATTRIBUTE, `${this.preferencesData["tableLength"]}`),
      new Attribute(ENTRY_POINT_ATTRIBUTE, this.preferencesData["entryPoint"]),
      new Attribute(DATETIME_DISPLAY_ATTRIBUTE, this.preferencesData["datetime"])
    ).subscribe(
      data => {
        this.user = data;
        this.dateTimePreference = new DateTimePreference(data);
        if (this.himself) {
          this.store.dispatch(new fromAuth.AuthTokenPayload(data));
        } else {
          this.lsService.storeLoginAsInfo(data, this.company);
          this.store.dispatch(new fromAuth.LoggedInAs());
        }
        this.editPreferences = false;
      }
    );
  }

  /**
   * Change Password modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _changePasswordModal: BsModalRef;
  changePasswordData = {
    password: "",
    newPassword: "",
    confirmNewPassword: ""
  };

  changePassword(template: TemplateRef<any>) {
    this.changePasswordData = {
      password: "",
      newPassword: "",
      confirmNewPassword: ""
    };
    this._changePasswordModal = this.modalService.show(template, { class: "modal-sm" });
  }

  doChangePassword(): void {
    this.restService.secureResetPassword(this.changePasswordData)
      .subscribe(
        success => {
          this._changePasswordModal.hide();
        }
      );
  }
  closeChangePasswordModal(): void {
    this._changePasswordModal.hide();
  }

  /**
   * Constructor to instantiate an instance of PreferencesComponent.
   */
  constructor(
    private actions$: Actions,
    private restService: RestService,
    private modalService: BsModalService,
    private store: Store<ProfileState>,
    private lsService: LocalStorageService) { }

  ngOnInit() {
    this.user = new User();
    this.store.pipe(select(getConfigTimezonesKeys), take(1)).subscribe(val => {
      this.timezones = val;
    });

    this.dateTimePreference = new DateTimePreference(null);

    this.store.pipe(select(getProfileModel), take(1)).subscribe(currentUser => {
      this.store.pipe(select(getConfigCompany), take(1)).subscribe(currentCompany => {
        // Need to take logged-in-as user if specified
        let loggedInAs = this.lsService.getLoginAs();
        this.himself = !loggedInAs;
        this.company = this.himself ? currentCompany : this.lsService.getCompany();
        this.userId = this.himself ? currentUser.id : loggedInAs.id;

        this.restService.getUser(this.userId)
          .subscribe(
            data => {
              this.user = data;
              this.dateTimePreference = new DateTimePreference(data);

            }
          );
      });
    });
  }

}

