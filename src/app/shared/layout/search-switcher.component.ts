import {Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {config} from '@app/core/smartadmin.config';
import {LayoutService} from '@app/core/services/layout.service';
import { RestService, SearchResult } from '@app/core/services';
import { Subscription } from 'rxjs';
import { NgScrollbar } from 'ngx-scrollbar';

declare var $: any;

@Component({
  selector: 'sa-search-switcher',
  templateUrl: './search-switcher.component.html'
})
export class SearchSwitcherComponent implements OnInit, OnDestroy {
  isActivated:boolean;
  selectedTab:number = 0;
  tabs: Array<string> = ['Tab1'];
  vehicleEventsTypes: Array<string> = [];
  driverEventsTypes: Array<string> = [];
  deviceEventsTypes: Array<string> = [];
  selectedEventsTypes: Array<Array<string>> =[[]];

  searchTexts: Array<string> = [];
  searchResults: Array<SearchResult[]> = [];
  currentPageNums: Array<number> = [1];
  searchPageNums: Array<number> = [0]; 
  
  @ViewChild(NgScrollbar) scrollbarRef: NgScrollbar;

  constructor(
    public layoutService:LayoutService,
    private restService: RestService) { }

  ngOnInit() {
    // this.sub = this.layoutService.subscribe((store)=>{
    //   this.store = store;
    // });
    // this.store = this.layoutService.store;
    
    this.layoutService.searchUpdated.subscribe(active =>{
      this.isActivated = active;
    });
    
    this.getEventTypes();
  }

  ngOnDestroy(){
    // this.sub.unsubscribe()
  }

  ngAfterViewInit(){
    
  }

  onToggle() {
    this.isActivated = !this.isActivated;
    this.layoutService.onSearchActivate(this.isActivated);
    this.layoutService.onLayoutActivate(false);
  }

  onTabSelect(index) {
    this.selectedTab = index;
  }

  onAddTab() {
    let newTab = this.tabs.length;
    this.tabs.push(`Tab${newTab+1}`);
    this.selectedTab = newTab;
    this.selectedEventsTypes[newTab] = [];
  }

  getEventTypes() {
    this.restService.getEventsType("vehicleevents")
    .subscribe(data=>this.vehicleEventsTypes = data);

    this.restService.getEventsType("driverevents")
    .subscribe(data=>this.driverEventsTypes = data);

    this.restService.getEventsType("deviceevents")
    .subscribe(data=>this.deviceEventsTypes = data);
  }

  onSearch( index ) {
    this.restService.getSearchResult(this.searchTexts[index])
    .subscribe(
      data => {
        this.searchResults[index] = data.filter(result=>
          ['Vehicle', 'Driver', 'Device'].includes(result.entityType)
        );
        this.currentPageNums[index] = 1;
        this.searchPageNums[index] = Math.ceil(data.length/5);
      }
    );
  }

  onTypeChecked(e, type, tabIndex) {
    let index = this.selectedEventsTypes[tabIndex].indexOf(type);

    if(!e.target.checked && index > -1) this.selectedEventsTypes[tabIndex].splice(index, 1);
    else if(e.target.checked && index === -1) this.selectedEventsTypes[tabIndex].push(type);
  }

  isChecked(type, tabIndex){
    return this.selectedEventsTypes[tabIndex].indexOf(type) > -1;
  }

  counter(index) {
    let counter = this.searchPageNums[index];
    // if (counter > 5) counter = 5;
    return new Array(counter);
  }

  onChangePage(e, index){
    this.currentPageNums[index] = e;
  }

  getItems(index) {
    let start = (this.currentPageNums[index]-1)*5;
    return this.searchResults[index].slice(start, start+5);
  }

  onItemClicked(item, index) {
    this.tabs[index] = item.search;
    this.restService.doViewItem(item, this.selectedEventsTypes[index]);
  }
}
