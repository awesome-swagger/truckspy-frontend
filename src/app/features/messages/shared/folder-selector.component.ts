import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'folder-selector',
  template: `<div class="btn-group visible-tablet" dropdown>
    <button class="btn btn-default dropdown-toggle" dropdownToggle>
        {{currentPath | titlecase}}
        <i class="fa fa-caret-down"></i>
    </button>
    <ul class="dropdown-menu" *dropdownMenu>
        <li [class.active]="folder == currentPath" *ngFor="let folder of folders">
            <a [routerLink]="['/messages', folder]">{{folder | titlecase}}
                <i *ngIf="folder == currentPath" class="fa fa-check"></i>
            </a>
        </li>
    </ul>
  </div>`
})
export class FolderSelectorComponent implements OnInit {

  currentPath: string;
  public folders = ["inbox", "sent", "draft", "archived"];

  constructor(
    private route: ActivatedRoute,
    private router: Router) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        let path = this.route.routeConfig.path;
        this.currentPath = this.folders.includes(path) ? path : "Folder";
      }
    });
  }

  ngOnInit() { }

}
