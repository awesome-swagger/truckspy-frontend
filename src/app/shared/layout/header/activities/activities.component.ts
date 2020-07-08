import { Component, OnInit, ElementRef, Renderer, OnDestroy } from '@angular/core';
import { Notification, RestService } from '@app/core/services';
import { Subscription, interval } from 'rxjs';
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';

import { AuthState, LoggedInAs, LoggedOutAs } from '@app/core/store/auth';

declare var $: any;
const ONE_HOUR_MILLIS: number = 3600 * 1000;

@Component({
  selector: 'sa-activities',
  templateUrl: './activities.component.html'
})
export class ActivitiesComponent implements OnInit, OnDestroy {

  count: number;
  lastUpdate: any;
  active: boolean;
  activities: Notification[];
  loading: boolean;

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.doLoadNotifications();
    }
  });

  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.doLoadNotifications();
    }
  });

  /**
   * Constructor to instantiate an instance of ActivitiesComponent.
   */
  constructor(
    private actions$: Actions,
    private store: Store<AuthState>,
    private el: ElementRef,
    private renderer: Renderer,
    private restService: RestService) {
    this.active = false;
    this.loading = false;
    this.activities = [];
    this.count = 0;
  }

  doLoadNotifications(callback?: Function) {
    function getNowUTC() {
      const now = new Date();
      return new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    }

    this.restService.get1000Notifications()
      .subscribe(data => {
        this.activities = data;
        this.count = data.length;
        this.lastUpdate = getNowUTC();
        if (callback) {
          callback();
        }
      });
  }

  subscription: Subscription;
  ngOnInit() {
    this.doLoadNotifications();
    this.subscription = interval(ONE_HOUR_MILLIS)
      .subscribe(x => this.doLoadNotifications());
  }

  removeNotification(notificationId: string) {
    this.activities = this.activities.filter(
      next => next.id !== notificationId);
    this.count = this.activities.length;
  }

  update() {
    this.loading = true;
    this.doLoadNotifications(() => {
      this.loading = false
    });
  }

  /**
   * Holder for the global mouseup document listener.
   * The logic below is related to the dropdown showing/hiding.
   */
  private documentSub: any;
  onToggle() {
    let dropdown = $('.ajax-dropdown', this.el.nativeElement);
    this.active = !this.active;
    if (this.active) {
      dropdown.fadeIn()

      this.documentSub = this.renderer.listenGlobal('document', 'mouseup', (event) => {
        if (!this.el.nativeElement.contains(event.target)) {
          dropdown.fadeOut();
          this.active = false;
          this.documentUnsub()
        }
      });
    } else {
      dropdown.fadeOut()
      this.documentUnsub()
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.documentUnsub()
  }

  documentUnsub() {
    this.documentSub && this.documentSub();
    this.documentSub = null
  }

}
