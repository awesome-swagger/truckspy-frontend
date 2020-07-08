import {Subscription} from "rxjs";
import { Component, OnInit, OnDestroy, ElementRef, AfterViewInit, AfterContentInit, Renderer2 } from '@angular/core';
import { Router} from "@angular/router";

import { trigger, state, style, transition, animate} from '@angular/animations'
import { Actions } from "@ngrx/effects";
import { Store, select } from "@ngrx/store";
import { take } from "rxjs/operators";

import { LayoutService, LogoutService, LocalStorageService } from "@app/core/services";
import { ProfileState, getProfileModel } from "@app/core/store/profile";
import { LoggedInAs, LoggedOutAs } from "@app/core/store/auth";
import { createProfile } from "@app/core/store/profile/profile.model";

@Component({
  selector: 'sa-shortcut',
  templateUrl: './shortcut.component.html',
  animations: [
    trigger('shortcutState', [
      state('out', style({
        height: 0,
      })),
      state('in', style({
        height: '*',
      })),
      transition('out => in', animate('250ms ease-out')),
      transition('in => out', animate('250ms 300ms ease-out'))
    ])
  ]
})
export class ShortcutComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {

  public state:string = 'out';

  private layoutSub:Subscription;
  private documentSub:any;

  private loggedInAsProfile;
  private user;
  theUser() {
    return !!this.loggedInAsProfile ? this.loggedInAsProfile : this.user;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loggedInAsProfile = createProfile(this.lsService.getLoginAs());
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loggedInAsProfile = null;
    }
  });

  constructor(
    private actions$: Actions,
    private layoutService: LayoutService,
    private logoutService: LogoutService,
    private store: Store<ProfileState>,
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef,
    private lsService: LocalStorageService) { }

  shortcutTo(route) {
    this.router.navigate(route);
    this.layoutService.onShortcutToggle(false);
  }

  showLogoutPopup() {
    this.logoutService.showPopup(this.theUser().name);
  }

  ngOnInit() {
    // Need to take logged-in-as user if specified
    let loggedInAs = this.lsService.getLoginAs();
    this.loggedInAsProfile = !!loggedInAs ? createProfile(loggedInAs) : null;
    this.store.pipe(select(getProfileModel), take(1)).subscribe(val => this.user = val);
  }

  listen() {
    this.layoutSub = this.layoutService.subscribe((store)=> {
      this.state = store.shortcutOpen ? 'in' : 'out'

      if (store.shortcutOpen) {
        this.documentSub = this.renderer.listen('document', 'mouseup', (event) => {
          if (!this.el.nativeElement.contains(event.target)) {
            this.layoutService.onShortcutToggle(false);
            this.documentUnsub()
          }
        });
      } else {
        this.documentUnsub()
      }
    })
  }

  ngAfterContentInit() {
    this.listen()
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.layoutSub.unsubscribe();
  }

  documentUnsub() {
    this.documentSub && this.documentSub();
    this.documentSub = null
  }

}
