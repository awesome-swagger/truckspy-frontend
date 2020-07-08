import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-info-panel',
    template:
        `<style>
        .info-panel-container {
            max-width: 160px;
            width: 160px;
        }
        .info-panel-label {
            font-size: 10px;
            color: darkgray;
        }
      </style>
      <div class="panel panel-default info-panel-container">
        <div class="panel-body" style="padding: 10px;">
          <div style="width: 100%;">
            <i class="fa fa-{{iconName}} fa-3x pull-left" [style.color]="iconColor"></i>
            <div class="pull-right">
              <span class="info-panel-label">{{label}}</span>
              <br />
              <span class="pull-right" style="font-size: 13px;">
                {{value}}
              </span>
            </div>
          </div>
          <div class="clearfix"></div>
          <hr class="simple" *ngIf="timeLabel">
          <div style="color: lightgray" *ngIf="timeLabel">
            <i class="fa fa-clock-o"></i>&nbsp;{{timeLabel}}
          </div>
        </div>
      </div>`
})
export class InfoPanelComponent {

    @Input() iconName: string;
    @Input() iconColor: string;
    @Input() label: string;
    @Input() value: string;
    @Input() timeLabel: string;

    constructor() { }

}
