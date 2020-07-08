import { Component, OnInit, ViewChild } from '@angular/core';
import { LocalStorageService, RestService, EntityType } from '@app/core/services';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  @ViewChild("resultsTable") resultsTable: any;
  query: string;

  options = {
    noToolbar: true,
    ajax: (data, callback, settings) => {
      this.restService.doSearch(this.query, false)
        .subscribe(
          data => {
            callback({
              aaData: data
            })
          }
        );
    },
    columns: [
      { data: "entityType" },
      {
        data: null,
        render: function (data, type, full, meta) {
          function getURI(entityType: string, entityId: string): string {
            switch (entityType) {
              case EntityType.DRIVER:
                return `#/drivers/${entityId}/view`;
              case EntityType.VEHICLE:
                return `#/vehicles/${entityId}/view`;
              case EntityType.REPORTING_PROFILE:
                return `#/reporting/${entityId}/view`;
              case EntityType.CONNECTION:
                return `#/company/connections/${entityId}/view`;

              default:
                return null;
            }
          }

          let uri = getURI(full.entityType, full.entityId);
          return uri ? `<a href='${uri}'>${full.search}</a>` : full.search;
        }
      }
    ]
  };

  doSearch() {
    this.lsStorage.storeSearch(this.query);
    this.resultsTable.ajaxReload();
  }

  constructor(
    private lsStorage: LocalStorageService,
    private restService: RestService) { }

  ngOnInit() {
    this.query = this.lsStorage.getSearch();
  }

}
