import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, NgZone } from '@angular/core';
import { Store, select } from "@ngrx/store";
import { take } from "rxjs/operators";
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import { RestService, FilterParams, DataTableService, GlobalFunctionsService } from '@app/core/services'
import { ConfigState, getConfigRoles } from '@app/core/store/config';
import { RoleFilterPipe } from '@app/shared/pipes/role-filter.pipe';

@Component({
  selector: 'app-company-users',
  templateUrl: './company-users.component.html',
  styleUrls: ['./company-users.component.css']
})
export class CompanyUsersComponent implements OnInit, OnDestroy {

  @ViewChild("usersTable") usersTable: any;

  orderColumnsUsers = ["firstName", "email", "roles", null];
  valueColumnsUsers = [
    { data: "name" },
    { data: "email" },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.roleFilter.transform(full.roles);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var userEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.changeRoleModal("${userEncoded}")'>Change&nbsp;role</a>`
          + `&nbsp;&nbsp;|&nbsp;&nbsp;`
          + `<a onclick='truckspy.revokeAccessModal("${userEncoded}")'>Revoke&nbsp;access</a>`;
      }.bind(this)
    }
  ];
  optionsUsers = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsUsers);
      this.restService.getAllUsers(params)
        .subscribe(
          data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          }
        );
    },
    columns: this.valueColumnsUsers
  };

  /**
   * Add User modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addUserModal: BsModalRef;
  userData = {};
  roles: string[];

  addUser(template: TemplateRef<any>) {
    this.userData = {
      firstName: "",
      lastName: "",
      email: "",
      role: (this.roles && this.roles.length >= 1 && this.roles[0]) || ""
    };
    this._addUserModal = this.modalService.show(template, { class: "modal-sm" });
  }

  inviteUser(): void {
    this.restService.createUser(this.userData)
      .subscribe(
        data => {
          this._addUserModal.hide();
          this.usersTable.ajaxReload();
        }
      );
  }
  closeUserModal(): void {
    this._addUserModal.hide();
  }

  /**
   * Revoke Access modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("revokeAccessModal") _revokeAccessModal: ModalDirective;
  forUser = {
    email: ""
  };

  revokeAccessModal(userEncoded: string) {
    this.ngZone.run(() => {
      var user = this.gfService.decodeParam(userEncoded);
      this.revokeAccessModalPrivate(user);
    });
  }
  revokeAccessModalPrivate(user: any) {
    this.forUser = user;
    this._revokeAccessModal.show();
  }

  closeRevokeAccessModal() {
    this._revokeAccessModal.hide();
  }
  revokeAccess(user: any) {
    this.restService.deleteUser(user.id)
      .subscribe(
        success => {
          this._revokeAccessModal.hide();
          this.usersTable.ajaxReload();
        }
      );
  }

  /**
   * Change Role modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("changeRoleModal") _changeRoleModal: ModalDirective;
  changeRoleData = {
    id: "",
    email: "",
    role: ""
  };

  changeRoleModal(userEncoded: string) {
    this.ngZone.run(() => {
      var user = this.gfService.decodeParam(userEncoded);
      this.changeRoleModalPrivate(user);
    });
  }
  changeRoleModalPrivate(user: any) {
    this.changeRoleData = {
      email: user.email,
      id: user.id,
      role: (user.roles && user.roles.length >= 1 && user.roles[0]) || ""
    };
    this._changeRoleModal.show();
  }

  closeChangeRoleModal() {
    this._changeRoleModal.hide();
  }
  changeRole(changeRoleData: any) {
    let data = {
      roles: [changeRoleData.role]
    };
    this.restService.updateUser(changeRoleData.id, data)
      .subscribe(
        success => {
          this._changeRoleModal.hide();
          this.usersTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of CompanyUsersComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private store: Store<ConfigState>,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private roleFilter: RoleFilterPipe) { }

  ngOnInit() {
    this.store.pipe(select(getConfigRoles), take(1)).subscribe(val => {
      this.roles = val;
    });

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.revokeAccessModal = this.revokeAccessModal.bind(this);
    window.truckspy.changeRoleModal = this.changeRoleModal.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.revokeAccessModal = null;
    window.truckspy.changeRoleModal = null;
  }

}
