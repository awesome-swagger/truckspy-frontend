import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from "@angular/router";
import { Observable, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, tap, switchMap, filter } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { plainToClass } from "class-transformer";

import { environment } from '@env/environment';
import { LocalStorageService, RestService, SearchResult, EntityType, User, Company } from '@app/core/services';
import { AuthState, LoggedInAs, LoggedOutAs, getUser } from '@app/core/store/auth';
import { FocusSearchBox } from '@app/core/store/shortcuts';

declare var $: any;
const API_URL = environment.apiBaseUrl;
const STRIPE_KEY = environment.stripePublishableKey.substring(0, 8) + '...';

@Component({
  selector: 'sa-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {

  /**
   * Shortcuts logic.
   */
  onFocusSearchBox = this.actions$.subscribe(action => {
    if (action instanceof FocusSearchBox) {
      $("#search-typeahead").focus();
    }
  });

  /**
   * Login As logic is here.
   */
  loggedInAs: User;
  companyName: string;
  user: User;
  theUser() {
    return !!this.loggedInAs ? this.loggedInAs : this.user;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loggedInAs = this.lsService.getLoginAs();
      let company = this.lsService.getCompany();
      this.companyName = company && company.name;
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loggedInAs = null;
      this.companyName = null;
    }
  });

  logOutAs() {
    this.lsService.clearLoginAsInfo();
    this.loggedInAs = null;
    this.companyName = null;
    this.store.dispatch(new LoggedOutAs());
    let home = this.user.getEntryPoint();
    this.router.navigate([home]);
  }

  /**
   * Constructor to instantiate an instance of HeaderComponent.
   */
  constructor(
    private actions$: Actions,
    private router: Router,
    private restService: RestService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) {
    console.log(`Back-end base URL is: ${API_URL}`);
    console.log(`Stripe publishable key is: ${STRIPE_KEY}`);
  }

  ngOnInit() {
    this.loggedInAs = this.lsService.getLoginAs();
    let company = this.lsService.getCompany();
    this.companyName = company && company.name;
    this.store.select(getUser).subscribe((user: any) => {
      this.user = plainToClass(User, user as User);
    });
  }

  /**
   * Search functionality.
   */
  searchMobileActive = false;

  toggleSearchMobile() {
    this.searchMobileActive = !this.searchMobileActive;

    $('body').toggleClass('search-mobile', this.searchMobileActive);
  }

  // onSubmit() {
  //   let value = $('#search-fld').val() || "";
  //   this.lsStorage.storeSearch(value);
  //   this.router.navigate(['/search']);
  // }

  searching: boolean;
  @ViewChild('searchInput') _searchInput: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  supportedTypes = [
      EntityType.DRIVER.toString(),
      EntityType.VEHICLE.toString(),
      EntityType.REPORTING_PROFILE.toString(),
      EntityType.CONNECTION.toString(),
      EntityType.LOCATION.toString()
  ];

  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(300), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this._searchInput.isPopupOpen()));
    const inputFocus$ = this.focus$;

    let isAdmin = this.theUser() && this.theUser().isAdmin();
    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      tap(() => this.searching = true),
      switchMap(term =>
        this.restService.doSearch(term, isAdmin).pipe(
          map(list => list.filter(entry => this.supportedTypes.includes(entry.entityType)).slice(0, 10))
        )
      ),
      tap(() => this.searching = false)
    );
  }

  model: any;
  openSelected(item) {
    function getURI(entityType: string, entityId: string): string {
      switch (entityType) {
        case EntityType.DRIVER:
          return `/drivers/${entityId}/view`;
        case EntityType.VEHICLE:
          return `/vehicles/${entityId}/view`;
        case EntityType.REPORTING_PROFILE:
          return `/reporting/${entityId}/view`;
        case EntityType.CONNECTION:
          return `/company/connections/${entityId}/view`;
        case EntityType.LOCATION:
          return `/location/list/${entityId}/view`;

        default:
          return null;
      }
    }

    item.preventDefault();
    let entry: SearchResult = item.item;
    let uri = getURI(entry.entityType, entry.entityId);

    let isAdmin = this.theUser() && this.theUser().isAdmin();
    if (uri) {
      if (isAdmin) {
        this.restService.getCompanyBy(entry.companyId)
          .subscribe(
            (company: Company) => {
              let firstOwner = (company && company.getFirstOwner()) || null;
              if (company && firstOwner) {
                this.lsService.storeLoginAsInfo(firstOwner, company);
                this.store.dispatch(new LoggedInAs());
                this.router.navigateByUrl('/empty', { skipLocationChange: true })
                  .then(() =>
                    this.router.navigate([uri])
                  );
              }
            }
          );
      } else {
        this.router.navigateByUrl('/empty', { skipLocationChange: true })
          .then(() =>
            this.router.navigate([uri])
          );
      }
    }
  }

}
