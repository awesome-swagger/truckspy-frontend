import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { Subscription, interval } from 'rxjs';

import { RestService, Message, FilterParams, Driver } from '@app/core/services';
import { FolderRefresh } from '../shared/messages.actions';
import { MessagesService } from '../shared/messages.service';

@Component({
  selector: 'app-archived',
  templateUrl: './archived.component.html',
  styleUrls: ['./archived.component.css']
})
export class ArchivedComponent implements OnInit, OnDestroy {

  messages: Message[] = [];
  total: number = 0;

  /**
   * Pagination logic.
   */
  page: number;
  totalPages: number = 0;
  drivers: Driver[] = [];

  getDriverName(id) {
    return this.messagesService.getDriverName(this.drivers, id);
  }

  getRange() {
    return this.messagesService.getRange(this.total, this.page);
  }

  previousPage() {
    this.setPage(this.page - 1);
  }
  nextPage() {
    this.setPage(this.page + 1);
  }

  /**
   * Ordering logic.
   */
  sort: string = "createdAt";
  ascending: boolean = false;
  orderBy(sort) {
    if (this.sort == sort) {
      this.ascending = !this.ascending;
    } else {
      this.ascending = false;
    }
    this.sort = sort;
    this.loadMessages();
  }

  /**
   * Open message logic.
   */
  openMessage(message: Message) {
    this.messagesService.storeMessage(message);
    this.router.navigate(["/messages/details"]);
  }

  /**
   * Reply message logic.
   */
  replyTo(message: Message) {
    this.messagesService.storeMessage(message, true);
    this.router.navigate(["/messages/details"]);
  }

  /**
   * Acknowledge logic.
   */
  acknowledge(message: Message) {
    this.restService.acknowledgeMessage(message.id)
      .subscribe(
        success => {
          this.loadMessages(false);
        }
      );
  }

  /**
   * Search functionality.
   */
  query: string = "";
  fixedQuery: string = "";

  doSearch() {
    this.fixedQuery = this.query;
    this.setPage(1);
  }

  clearSearch() {
    this.query = "";
    let searchDone = !!this.fixedQuery;
    this.fixedQuery = "";
    if (searchDone) {
      this.setPage(1);
    }
  }

  /**
   * Driver filtering functionality.
   */
  driverId: string = "";

  doFilter(newValue) {
    this.driverId = newValue;
    this.setPage(1);
  }

  /**
   * Cache of IDs of selected messages.
   */
  selectedMessages: string[] = [];
  all: boolean = false;

  recalculateSelectedMessages() {
    let result = [];
    this.messages.forEach((m: any) => {
      if (m.checked) {
        result.push(m.id);
      }
    });
    this.selectedMessages = result;
  }

  selectSingle(newValue, message) {
    message.checked = newValue;
    let notChecked = this.messages.find(function (m: any) {
      return !m.checked;
    });
    this.all = !notChecked;
    this.recalculateSelectedMessages();
  }
  selectAll(newValue) {
    this.messages.forEach((m: any) => {
      m.checked = newValue;
    });
    this.all = newValue;
    this.recalculateSelectedMessages();
  }

  readSelected() {
    this.restService.readMultipleMessages(this.selectedMessages)
      .subscribe(success => {
        this.loadMessages(false);
      });
  }
  unreadSelected() {
    this.restService.unreadMultipleMessages(this.selectedMessages)
      .subscribe(success => {
        this.loadMessages(false);
      });
  }
  unarchiveSelected() {
    this.restService.unarchiveMultipleMessages(this.selectedMessages)
      .subscribe(success => {
        this.loadMessages(false);
      });
  }

  /**
   * Constructor to instantiate an instance of ArchivedComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private actions$: Actions,
    private router: Router,
    private restService: RestService,
    private messagesService: MessagesService) { }

  onFolderRefresh: Subscription;

  /**
   * Fires messagees reloading either by query param listener or manually.
   * @param {number} page the page number to set and load
   */
  setPage(page: number) {
    if (page < 1) {
      page = 1;
    }

    let manualReload = this.page === page;
    if (manualReload) { // in case of #doSearch()
      this.loadMessages();
    } else {
      this.page = page;
      this.router.navigate(
        [],
        {
          relativeTo: this.route,
          queryParams: { 'page': `${page}` },
          queryParamsHandling: 'merge'
        });
    }
  }

  getPage(): number {
    let pageStr = this.route.snapshot.queryParamMap.get('page');
    if (!!pageStr || +pageStr >= 1) {
      return +pageStr;
    } else {
      this.setPage(1);
      return 1;
    }
  }

  ngOnInit() {
    this.page = this.getPage(); // do this prior to registering query parameter listener
    
    this.onFolderRefresh = this.actions$.subscribe(action => {
      if (action instanceof FolderRefresh) {
        this.loadMessages(false);
      }
    });

    let self = this;
    this.restService.get1000Drivers()
      .subscribe(
        drivers => {
          this.drivers = drivers;
          this.loadMessages();

          // let's subscribe for page parameter changes
          this.route.queryParams.subscribe(p => {
            if (!!p.page) {
              this.page = +p.page; // in case of back button utilized
              self.loadMessages();
            }
          });
        }
      );
  }

  /**
   * Loads list of messages based on the specified conditions.
   * 
   * `initialLoad` defines if it is initial load or reload/refresh.
   * In case of refresh need to preserve selected checkboxes.
   *
   * @param {boolean} [initialLoad=true] - `true` if it is initial load
   */
  loadMessages(initialLoad: boolean = true) {
    let params = new FilterParams(this.page, `${this.sort}.${this.ascending ? 'ASC' : 'DESC'}`);
    this.restService.getArchivedMessages(params, this.fixedQuery, this.driverId)
      .subscribe(
        data => {
          this.messages = data.results;

          if (!initialLoad) {
            this.messages.forEach((m: any) => {
              m.checked = this.selectedMessages.includes(m.id);
            });
          }
          this.recalculateSelectedMessages();

          this.total = data.resultCount;
          this.totalPages = this.messagesService.getTotalPages(this.total);
        }
      );
  }

  ngOnDestroy(): void {
    this.onFolderRefresh.unsubscribe();
  }

}
