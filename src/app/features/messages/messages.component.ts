import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { Store } from "@ngrx/store";

import { RestService } from '@app/core/services';
import { FolderRefresh } from './shared/messages.actions';
import { MessagesService } from './shared/messages.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  childPath: string;
  folders = ["inbox", "sent", "draft", "archived", "compose", "details"];

  refreshFolder() {
    this.store.dispatch(new FolderRefresh());
  }

  compose() {
    this.messagesService.clearDraftMessage();
    this.router.navigateByUrl('/empty', { skipLocationChange: true })
      .then(() =>
        this.router.navigate(["/messages/compose"])
      );
  }

  /**
   * Constructor to instantiate an instance of MessagesComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<any>,
    private restService: RestService,
    private messagesService: MessagesService) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        let path = this.route.firstChild.routeConfig.path;
        if (this.folders.includes(path)) {
          this.childPath = path;
        }
      }
    });
  }

  ngOnInit() { }

}
