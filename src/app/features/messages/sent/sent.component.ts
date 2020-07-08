import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Subscription } from 'rxjs';

import { RestService, Message, FilterParams, Driver } from '@app/core/services';
import { FolderRefresh } from '../shared/messages.actions';
import { MessagesService } from '../shared/messages.service';

@Component({
  selector: 'app-sent',
  templateUrl: './sent.component.html',
  styleUrls: ['./sent.component.css']
})
export class SentComponent implements OnInit, OnDestroy {

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
   * Constructor to instantiate an instance of SentComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actions$: Actions,
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
        this.loadMessages();
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

  loadMessages() {
    let params = new FilterParams(this.page, `${this.sort}.${this.ascending ? 'ASC' : 'DESC'}`);
    this.restService.getSentMessages(params, this.fixedQuery, this.driverId)
      .subscribe(
        data => {
          this.messages = data.results;
          this.total = data.resultCount;
          this.totalPages = this.messagesService.getTotalPages(this.total);
        }
      );
  }

  ngOnDestroy(): void {
    this.onFolderRefresh.unsubscribe();
  }

}
