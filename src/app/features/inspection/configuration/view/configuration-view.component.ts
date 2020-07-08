import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import { RestService, DataTableService, InspectionConfig, FilterParams, Question } from '@app/core/services'
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ExitEditMode } from '@app/core/store/shortcuts';
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';

@Component({
  selector: 'app-inspection-configuration-view',
  templateUrl: './configuration-view.component.html',
  styleUrls: ['./configuration-view.component.css']
})
export class ConfigurationViewComponent implements OnInit {

  configurationId: string;
  configuration: InspectionConfig;
  loaded: boolean = false;
  edit: boolean = false;
  configurationData = {
    name: ""
  };

  beginEdit() {
    this.configurationData = {
      name: this.configuration.name
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
    }
  });

  save() {
    this.restService.updateInspectionConfig(this.configurationId, this.configurationData)
      .subscribe(
        data => {
          this.configuration = data;
          this.edit = false;
        }
      );
  }

  constructor(
    private route: ActivatedRoute,
    private actions$: Actions,
    private restService: RestService,
    private modalService: BsModalService,
    private dataTableService: DataTableService,
    private dateService: DateService) { }

  ngOnInit() {
    this.configuration = new InspectionConfig();

    this.configurationId = this.route.snapshot.paramMap.get("id");
    this.reloadData();
  }

  reloadData(refresh: boolean = true) {
    this.restService.getInspectionConfig(this.configurationId)
      .subscribe(
        data => {
          this.loaded = true;
          this.configuration = data;
          this.reloadAvailableQuestions(refresh);
        }
      );
  }

  // Available Questions table
  qSearch: string = "";
  questionsFilter: {
    filteredQuestions: Question[],
    paginatedQuestions: {
      array: Question[],
      begin: number,
      end: number
    }
  } = {
      filteredQuestions: [],
      paginatedQuestions: {
        array: [],
        begin: 0,
        end: 0
      }
    };

  availableQuestions: Question[] = [];
  reloadAvailableQuestions(refresh: boolean = true) {
    this.restService.get1000QuestionsFor(this.configuration)
      .subscribe(
        data => {
          this.availableQuestions = data;
          this.initializeAvailableQuestions(refresh);
        }
      );
  }

  /**
   * Doing client side filtering: filtering, ordering, pagination.
   */
  initializeAvailableQuestions(refresh: boolean) {
    if (refresh) {
      this.qSearch = "";
    }
    this.changeAvailableQuestionsPage(refresh ? 1 : this.page);
  }

  page: number = 1;
  pageSize: number = 10;
  changeAvailableQuestionsPage(newPage) {
    this.page = newPage;
  }

  /**
   * Assign available Question logic.
   */
  onAvailableQuestionDrop(event: any) {
    let question: Question = event.dragData;
    this.restService.assignQuestionToInspectionConfig(this.configurationId, question.id)
      .subscribe(
        success => {
          this.reloadData(false);

          // const index = this.availableQuestions.findIndex(
          //   (next: Question) => next.id === question.id
          // )
          // this.availableQuestions.splice(index, 1);
        }
      );
  }

  /**
   * Unassign Question logic.
   */
  unassignQuestion(question: Question, actionComponent: LongActionLinkComponent) {
    this.restService.unassignQuestionFromInspectionConfig(this.configurationId, question.id)
      .subscribe(
        good => {
          this.reloadData(false);
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

}
