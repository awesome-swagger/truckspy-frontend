import { Component, OnInit, ViewChild, TemplateRef, NgZone } from '@angular/core';
import { BsModalService, ModalDirective, BsModalRef } from 'ngx-bootstrap';

import { RestService, FilterParams, DataTableService, Vehicle, InspectionConfig, GlobalFunctionsService } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-inspection-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {

  orderColumns = ["name", null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/inspection/configurations/${full.id}/view">${full.name}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.vehicles && full.vehicles.length === 0) {
          return "";
        }
        return full.vehicles
          .map(function (vehicle: Vehicle) {
            var remoteId = vehicle.remoteId || "(unspecified)";
            return `<a href="#/vehicles/${vehicle.id}/view">${remoteId}</a>`;
          })
          .join(", ");
      }.bind(this)
    }
  ]

  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllInspectionConfigs(params)
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

  @ViewChild("configurationsTable") configurationsTable: any;

  /**
   * Add Configuration modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addConfigurationModal: BsModalRef;
  configurationData = {};

  addConfiguration(template: TemplateRef<any>) {
    this.configurationData = {
      name: ""
    };
    this._addConfigurationModal = this.modalService.show(template, { class: "modal-400" });
  }

  createConfiguration(): void {
    this.restService.createInspectionConfig(this.configurationData)
      .subscribe(
        data => {
          this._addConfigurationModal.hide();
          this.configurationsTable.ajaxReload();
        }
      );
  }
  closeAddConfigurationModal(): void {
    this._addConfigurationModal.hide();
  }

  /**
   * Constructor to instantiate an instance of ConfigurationComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private dateService: DateService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.editQuestionModal = this.editQuestionModal.bind(this);
  }

  orderColumnsQuestions = ["text", "createdAt", "requireDescription", "allowImage", null];
  valueColumnsQuestions = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var questionEncoded = this.gfService.encodeParam(full);
        return `<a class="action-link" onclick='truckspy.editQuestionModal("${questionEncoded}")'>${full.text || '(unspecified)'}</a>`;
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        let createdAt = full.createdAt;
        return !!createdAt ? this.dateService.transformDateTime(createdAt) : "";
      }.bind(this)
    },
    { data: "requireDescriptionLabel" },
    { data: "allowImageLabel" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.inspectionConfigs && full.inspectionConfigs.length === 0) {
          return "";
        }
        return full.inspectionConfigs
          .map(function (next: InspectionConfig) {
            return `<a href="#/inspection/configurations/${next.id}/view">${next.name}</a>`;
          })
          .join(", ");
      }.bind(this)
    }
  ]

  optionsQuestions = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsQuestions);
      this.restService.getAllQuestions(params)
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
    columns: this.valueColumnsQuestions,
    order: [[1, 'desc']]
  };

  @ViewChild("questionsTable") questionsTable: any;

  /**
   * Add Question modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addQuestionModal: BsModalRef;
  questionData = {};

  addQuestion(template: TemplateRef<any>) {
    this.questionData = {
      text: "",
      requireDescription: true,
      allowImage: true
    };
    this._addQuestionModal = this.modalService.show(template, { class: "modal-450" });
  }

  createQuestion(): void {
    this.restService.createQuestion(this.questionData)
      .subscribe(
        data => {
          this._addQuestionModal.hide();
          this.questionsTable.ajaxReload();
        }
      );
  }
  closeAddQuestionModal(): void {
    this._addQuestionModal.hide();
  }

  /**
   * Edit Question modal directive reference to operate with within component.
   * @type {BsModalRef}
   */
  _editQuestionModal: BsModalRef;

  @ViewChild("editQuestionModal") editQuestionModalTemplate: TemplateRef<any>;
  theQuestion: any = {};

  editQuestionModal(questionEncoded: string) {
    this.ngZone.run(() => {
      var question = this.gfService.decodeParam(questionEncoded);
      this.editQuestionModalPrivate(question);
    });
  }
  editQuestionModalPrivate(question: any) {
    this.theQuestion = question;
    this._editQuestionModal = this.modalService.show(this.editQuestionModalTemplate, { class: "modal-450" });
  }

  closeEditQuestionModal() {
    this._editQuestionModal.hide();
  }
  saveQuestion() {
    this.restService.updateQuestion(this.theQuestion.id, this.theQuestion)
      .subscribe(
        data => {
          this._editQuestionModal.hide();
          this.questionsTable.ajaxReload();
        });
  }

}
