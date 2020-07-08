import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

@Component({
    selector: 'app-empty',
    template: `<div id="content">
    </div>`
})
export class EmptyComponent implements OnInit {
    constructor() { }
    ngOnInit() { }
}

export const emptyRoutes: Routes = [
    {
        path: '',
        component: EmptyComponent,
        data: {
            pageTitle: 'Empty'
        }
    }
];
export const emptyRouting: ModuleWithProviders = RouterModule.forChild(emptyRoutes);

@NgModule({
    declarations: [EmptyComponent],
    imports: [
        CommonModule,
        emptyRouting,
        SharedModule
    ]
})
export class EmptyModule { }
