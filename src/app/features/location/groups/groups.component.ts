import { Component, OnInit, ViewChild, NgZone, TemplateRef } from '@angular/core';
import { BsModalService, ModalDirective, BsModalRef } from 'ngx-bootstrap';

import { RestService, GlobalFunctionsService } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {

  loadGroups(data, callback, settings, global: boolean = true) {
    this.restService.get1000LocationGroups()
      .subscribe(
        data => {
          let nonGlobals = data.filter(
            group => global ? group.isGlobal() : !group.isGlobal());
          callback({
            aaData: nonGlobals,
            recordsTotal: nonGlobals.length,
            recordsFiltered: nonGlobals.length
          })
        }
      );
  }

  defineColumns(global: boolean = true) {
    return [
      {
        data: null,
        render: function (data, type, full, meta) {
          var name = full.name;
          var id = full.id;
          return `<a href="#/location/locations?groupId=${id}">${name}</a>`;
        }
      },
      {
        data: null,
        render: function (data, type, full, meta) {
          return this.dateService.transformDateTime(full.createdAt);
        }.bind(this)
      },
      { data: "locationCount" },
      {
        data: null,
        orderable: false,
        render: function (data, type, full, meta) {
          var groupEncoded = this.gfService.encodeParam(full);
          return (global ? "" : `<a onclick='truckspy.deleteGroupModal("${groupEncoded}")'>Delete</a>&nbsp;&nbsp;|&nbsp;&nbsp;`)
            + `<a href="#/location/locations?groupId=${full.id}">View</a>`;
        }.bind(this)
      }
    ]
  }

  options = {
    noToolbar: true,
    serverSide: false,
    ajax: (data, callback, settings) => this.loadGroups(data, callback, settings, false),
    columns: this.defineColumns(false),
    order: [[ 1, 'desc' ]]
  };

  optionsGlobal = {
    noToolbar: true,
    serverSide: false,
    ajax: (data, callback, settings) => this.loadGroups(data, callback, settings),
    columns: this.defineColumns(),
    order: [[ 1, 'desc' ]]
  };

  @ViewChild("localGroupsTable") localGroupsTable: any;

  /**
   * Add Location Group modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addGroupModal: BsModalRef;
  groupData = {};

  addGroup(template: TemplateRef<any>) {
    this.groupData = {
      name: ""
    };
    this._addGroupModal = this.modalService.show(template, { class: "modal-sm" });
  }

  createGroup(): void {
    this.restService.createLocationGroup(this.groupData)
      .subscribe(
        data => {
          this._addGroupModal.hide();
          this.localGroupsTable.ajaxReload();
        }
      );
  }
  closeAddGroupModal(): void {
    this._addGroupModal.hide();
  }

  /**
   * Delete Location Group modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("deleteGroupModal") _deleteGroupModal: ModalDirective;
  forGroup = {
    name: ""
  };

  deleteGroupModal(groupEncoded: string) {
    this.ngZone.run(() => {
      var group = this.gfService.decodeParam(groupEncoded);
      this.deleteGroupModalPrivate(group);
    });
  }
  deleteGroupModalPrivate(group: any) {
    this.forGroup = group;
    this._deleteGroupModal.show();
  }

  closeDeleteGroupModal() {
    this._deleteGroupModal.hide();
  }
  deleteGroup(group: any) {
    this.restService.deleteLocationGroup(group.id)
      .subscribe(
        success => {
          this._deleteGroupModal.hide();
          this.localGroupsTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of GroupsComponent.
   */
  constructor(
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.deleteGroupModal = this.deleteGroupModal.bind(this);
  }

}
