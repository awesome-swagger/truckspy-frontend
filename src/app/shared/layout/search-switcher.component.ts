import {Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {config} from '@app/core/smartadmin.config';
import {LayoutService} from '@app/core/services/layout.service';
import { RestService, SearchResult} from '@app/core/services';
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
  closeIcons: Array<boolean>=[false];
  
  vehicle1000: Array<any> = [];
  driver1000: Array<any> = [];
  device1000: Array<any> = [];
  vehicleEventsTypes: Array<string> = [];
  driverEventsTypes: Array<string> = [];
  deviceEventsTypes: Array<string> = [];
  selectedEventsTypes: Array<Array<string>> =[[]];

  searchTexts: Array<string> = [];
  searchResults: Array<any[]> = [];
  currentPageNums: Array<number> = [1];
  searchPageNums: Array<number> = [0];
  searchResultStates: Array<boolean> = [];
  
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
    this.getDataForSearch();
  }

  onToggle() {
    this.isActivated = !this.isActivated;
    this.layoutService.onSearchActivate(this.isActivated);
    this.layoutService.onLayoutActivate(false);
  }

  onMouseEnter(index: number) {
    this.closeIcons[index] = true;
  }
  onMouseLeave(index: number) {
    this.closeIcons[index] = false;
  }
  showCloseIcon(index: number) {
    if(this.tabs.length === 1) return false;
    return this.closeIcons[index];
  }
  onCloseTab(index: number) {
    this.tabs.splice(index, 1);
    this.searchTexts.splice(index, 1);
    this.searchResults.splice(index, 1);
    this.currentPageNums.splice(index, 1);
    this.searchPageNums.splice(index, 1);
    this.searchResultStates.splice(index, 1);

    this.selectedTab = index ? index-1 : 0;;
  }

  onTabSelect(index) {
    this.selectedTab = index;
  }

  onAddTab() {
    let newTab = this.tabs.length;
    this.tabs.push(`Tab${newTab+1}`);
    this.selectedTab = newTab;
    this.selectedEventsTypes[newTab] = [];

    this.scrollbarRef.scrollToElement("#add_tab");
  }

  getEventTypes() {
    this.restService.getEventsType("vehicleevents")
    .subscribe(data=>this.vehicleEventsTypes = data.filter(item=>item !== "UNKNOWN" && item !== "DRIVE_ALERT_VIDEO"));

    this.restService.getEventsType("driverevents")
    .subscribe(data=>this.driverEventsTypes = data.filter(item=>item !== "UNKNOWN"));

    this.restService.getEventsType("deviceevents")
    .subscribe(data=>this.deviceEventsTypes = data.filter(item=>item !== "UNKNOWN"));
  }

  getDataForSearch() {    
    this.restService.get1000Vehicles().subscribe(
      data => this.vehicle1000 = data
    );
    this.restService.get1000ActiveDrivers().subscribe(
      data => this.driver1000 = data
    );
    this.restService.get1000Devices().subscribe(
      data => this.device1000 = data
    );
  }

  onSearch( index ) {
    const text = this.searchTexts[index];
    this.searchResults[index] = [];
    this.searchResultStates[index] = false;
    if(text.trim()==="") return;

    this.vehicle1000.forEach(vehicle => {
      if (vehicle.reportingProfile.name.indexOf(text)>-1)
        this.searchResults[index].push({
          id: vehicle.id, 
          name: vehicle.reportingProfile.name,
          type: "Vehicle",
          description: `Vehicle - ${vehicle.status}`,
        });
    });
    
    this.driver1000.forEach(driver => {
      if ((driver.firstName && driver.firstName.indexOf(text)>-1) 
          || (driver.lastName && driver.lastName.indexOf(text)>-1))
        this.searchResults[index].push({
          id: driver.id, 
          name: `${driver.firstName} ${driver.lastName}`,
          type: "Driver",
          description: `Driver - ${driver.status}`,
        });
    });

    this.device1000.forEach(device => {
      if (device.reportingProfile.name.indexOf(text)>-1)
        this.searchResults[index].push({
          id: device.id, 
          name: device.reportingProfile.name,
          type: "Device",
          description: `Device - ${device.type}`,
        });
    });

    this.currentPageNums[index] = 1;
    this.searchPageNums[index] = Math.ceil(this.searchResults[index].length / 5);
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
    if (this.searchResultStates[index]) return;

    this.tabs[index] = item.name;
    this.searchResultStates[index] = true;
    this.searchResults[index] = [];

    this.restService.doViewItem(item, this.selectedEventsTypes[index]).subscribe(
      data => {
        data.results.forEach(({datetime, textualLocation})=>
          this.searchResults[index].push({name: textualLocation, description: datetime})
        );
    
        this.currentPageNums[index] = 1;
        this.searchPageNums[index] = Math.ceil(this.searchResults[index].length / 5);
      }
    );
  }
}
