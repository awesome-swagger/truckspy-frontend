import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Store, select } from "@ngrx/store";
import { take } from "rxjs/operators";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigState, getConfigConnectionTypes } from '@app/core/store/config';
import { RestService, FilterParams, DataTableService, ConnectionType } from '@app/core/services'

@Component({
  selector: 'app-company-connections',
  templateUrl: './company-connections.component.html',
  styleUrls: ['./company-connections.component.css']
})
export class CompanyConnectionsComponent implements OnInit {

  @ViewChild("connectionsTable") connectionsTable: any;

  orderColumnsConnections = ["name", "type", "enabled"];
  valueColumnsConnections = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/company/connections/${full.id}/view">${full.name}</a>`;
      }
    },
    { data: "type" },
    { data: "status" }
  ];
  optionsConnections = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsConnections);
      this.restService.getAllConnections(params)
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
    columns: this.valueColumnsConnections
  };

  /**
   * Add Connection modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addConnectionModal: BsModalRef;
  connectionData = {
    name: "",
    type: "",
    auth: {}
  };
  connectionTypes: ConnectionType[] = [];
  authFields: string[] = [];

  addConnection(template: TemplateRef<any>) {
    this.connectionData = {
      name: "",
      type: (this.connectionTypes && this.connectionTypes.length >= 1 && this.connectionTypes[0].type) || "",
      auth: (this.connectionTypes && this.connectionTypes.length >= 1 && this.connectionTypes[0].initAuth()) || {}
    };
    this.authFields = (this.connectionTypes && this.connectionTypes.length >= 1 && this.connectionTypes[0].auth) || [];
    this._addConnectionModal = this.modalService.show(template, { class: "" });
  }

  onTypeChange(value): void {
    let connectionType = this.connectionTypes.find(function (element) {
      return element.type === value;
    });

    this.connectionData.type = (connectionType && connectionType.type) || "";
    this.connectionData.auth = (connectionType && connectionType.initAuth()) || {};
    this.authFields = (connectionType && connectionType.auth) || [];
  }

  createConnection(): void {
    this.restService.createConnection(this.connectionData)
      .subscribe(
        data => {
          this._addConnectionModal.hide();
          this.connectionsTable.ajaxReload();
        }
      );
  }
  closeConnectionModal(): void {
    this._addConnectionModal.hide();
  }

  /**
   * Constructor to instantiate an instance of CompanyConnectionsComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private store: Store<ConfigState>) { }

  ngOnInit() {
    this.store.pipe(select(getConfigConnectionTypes), take(1)).subscribe(val => {
      this.connectionTypes = val;
    });
  }

}
