import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, NgZone } from '@angular/core';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import { RestService, FilterParams, DataTableService, GlobalFunctionsService } from '@app/core/services'

@Component({
  selector: 'app-company-feedbacktypes',
  templateUrl: './company-feedbacktypes.component.html',
  styleUrls: ['./company-feedbacktypes.component.css']
})
export class CompanyFeedbackTypesComponent implements OnInit, OnDestroy {

  @ViewChild("feedbacktypesTable") feedbacktypesTable: any;

  orderColumns = ["name", "type", null];
  valueColumns = [
    { data: "name" },
    { data: "type" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var typeEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.editFeedbackTypeModal("${typeEncoded}")'>Edit</a>`;
      }.bind(this)
    }
  ];
  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllFeedbackTypes(params)
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
    columns: this.valueColumns
  };

  /**
   * Add FeedbackType modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addFeedbackTypeModal: BsModalRef;
  feedbackTypeData = {};
  types = ["STRING", "DOUBLE", "BOOL"];

  addFeedbackType(template: TemplateRef<any>) {
    this.feedbackTypeData = {
      name: "",
      type: this.types[0]
    };
    this._addFeedbackTypeModal = this.modalService.show(template, { class: "modal-sm" });
  }

  createFeedbackType(): void {
    this.restService.createFeedbackType(this.feedbackTypeData)
      .subscribe(
        data => {
          this._addFeedbackTypeModal.hide();
          this.feedbacktypesTable.ajaxReload();
        }
      );
  }
  closeFeedbackTypeModal(): void {
    this._addFeedbackTypeModal.hide();
  }

  /**
   * Edit modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("editFeedbackTypeModal") _editFeedbackTypeModal: ModalDirective;
  editData = {
    id: "",
    name: "",
    type: ""
  };

  editFeedbackTypeModal(typeEncoded: string) {
    this.ngZone.run(() => {
      var type = this.gfService.decodeParam(typeEncoded);
      this.editFeedbackTypeModalPrivate(type);
    });
  }
  editFeedbackTypeModalPrivate(type: any) {
    this.editData = {
      id: type.id,
      name: type.name,
      type: type.type
    };
    this._editFeedbackTypeModal.show();
  }

  closeEditFeedbackTypeModal() {
    this._editFeedbackTypeModal.hide();
  }
  doEdit(editData: any) {
    let data = {
      name: editData.name,
      type: editData.type
    };
    this.restService.updateFeedbackType(editData.id, data)
      .subscribe(
        success => {
          this._editFeedbackTypeModal.hide();
          this.feedbacktypesTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of CompanyFeedbackTypesComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.editFeedbackTypeModal = this.editFeedbackTypeModal.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.editFeedbackTypeModal = null;
  }

}
