import { Component, OnInit } from '@angular/core';
import { ProfileState, getProfileModel } from '@app/core/store/profile';
import { Store, select } from '@ngrx/store';
import { take } from 'rxjs/operators';

@Component({
  selector: 'sa-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {

  public lastLogin = "N/A";

  constructor(private store: Store<ProfileState>) { }

  ngOnInit() {
    this.store.pipe(select(getProfileModel), take(1)).subscribe(val => this.lastLogin = val.lastLogin);
  }

}
