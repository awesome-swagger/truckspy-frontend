import {Component, OnInit, OnDestroy} from '@angular/core';
import {config} from '@app/core/smartadmin.config';
import {LayoutService} from '@app/core/services/layout.service'
import { Subscription } from 'rxjs';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

declare var $: any;

@Component({
  selector: 'sa-search-switcher',
  templateUrl: './search-switcher.component.html'
})
export class SearchSwitcherComponent implements OnInit, OnDestroy {
  isActivated:boolean;
  selectedTab:number = 0;
  tabs: Array<string> = ['tab1'];
  searchTexts: Array<string> = [''];

  dropdownList = [];
  selectedItems = [];
  dropdownSettings:IDropdownSettings = {};

  constructor(public layoutService:LayoutService) {}

  ngOnInit() {
    // this.sub = this.layoutService.subscribe((store)=>{
    //   this.store = store;
    // });
    // this.store = this.layoutService.store;
    
    this.layoutService.searchUpdated.subscribe(active =>{
      this.isActivated = active;
    });
    
    this.dropdownList = [
      { item_id: 1, item_text: 'Login' },
      { item_id: 2, item_text: 'Logout' },
      { item_id: 3, item_text: 'Trip Started' },
      { item_id: 4, item_text: 'Trip Completed' },
      { item_id: 5, item_text: 'Another Type' }
    ];
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      enableCheckAll: false,
      itemsShowLimit: 2
    };

  }

  ngOnDestroy(){
    // this.sub.unsubscribe()
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
    this.tabs.push(`tab${newTab+1}`);
    this.selectedTab = newTab;
  }

  onItemSelect(e, index) {
    console.log(e, index);
  }

  onPagePrevious(index) {
    console.log(index);
  }
  onPageNext(index) {
    console.log(index);
  }
  onPageDisplay(index, num){
    console.log(index, num);
  }
}
