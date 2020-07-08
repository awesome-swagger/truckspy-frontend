import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { StockChart } from 'angular-highcharts';

import { RestService, Reportable, Statistics, Company } from '@app/core/services';
import { TimezoneHandlerPipe } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  @ViewChild("appReportsTable") appReportsTable: any;

  company: Company;
  entity: Reportable;
  entities: Reportable[] = [];
  entitiesLoaded = false;

  onEntityChange(value): void {
    this.entity = value;
    this.appReportsTable.reloadReportsFor(value);
    this.loadStatistics(value.id, this.period, this.dataset);
  }

  /**
   * Statistics logic.
   */
  statistics: Statistics;
  emptyOptions = {
    rangeSelector: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    title: {
      text: `0%`
    },
    series: []
  }
  stock: StockChart = new StockChart(this.emptyOptions);
  statisticsLoaded: boolean;

  reportPeriods: any[];
  period: string;
  setPeriodTo(newPeriod) {
    this.period = newPeriod;
    this.loadStatistics(this.entity.id, this.period, this.dataset);
  }

  datasets: string[];
  dataset: string;
  datasetChanged(newDataset) {
    this.dataset = newDataset;
    this.loadStatistics(this.entity.id, this.period, newDataset);
  }

  /**
   * Constructor to instantiate an instance of DashboardComponent.
   */
  constructor(
    private restService: RestService,
    private timezoneHandler: TimezoneHandlerPipe) { }

  ngOnInit() {
    this.restService.getCompany()
      .subscribe(
        company => {
          this.entities.push(company);
          this.company = company;
          this.entity = company;

          // load reporting profiles
          this.restService.get1000ReportingProfiles()
            .subscribe(profiles => {
              profiles.forEach(p => {
                this.entities.push(p);
              });

              this.entitiesLoaded = true;
            });

          // load statistics
          this.restService.getReportPeriods()
            .subscribe(periods => {
              this.reportPeriods = periods;
              this.period = (this.reportPeriods && this.reportPeriods.length > 0) ? this.reportPeriods[0].value : "";

              this.restService.getStatisticsDatasets()
                .subscribe(datasets => {
                  this.datasets = datasets;
                  this.dataset = (this.datasets && this.datasets.length > 0) ? this.datasets[0] : "";

                  this.loadStatistics(this.entity.id, this.period, this.dataset);
                });
            });
        }
      );
  }

  destroyChart() {
    if (!!this.stock) {
      this.stock.destroy();
    }
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  loadStatistics(entityId: string, period: string, dataset: string) {
    let timezoneHandler = this.timezoneHandler;

    this.restService.getStatistics(entityId, entityId === this.company.id, period, dataset)
      .subscribe(statistics => {
        this.statistics = statistics;

        let theTitle = `${this.statistics.getTotals()}`;
        if (!!this.statistics.percentChange) {
          theTitle = `${this.statistics.percentChange > 0 ? "+" : ""}${this.statistics.percentChange}% ${theTitle}`;
        } else {
          theTitle = `0% ${theTitle}`;
        }

        let options = {
          rangeSelector: {
            enabled: false
          },
          credits: {
            enabled: false
          },
          scrollbar: {
            enabled: false
          },
          navigator: {
            enabled: false
          },
          xAxis: {
            title: {
              text: 'date'
            }
          },
          yAxis: {
            opposite: false,
            title: {
              text: this.statistics.getUnit()
            }
          },
          title: {
            text: theTitle
          },
          series: this.statistics.getSeriesData().map(function (data: any) {
            function transformDates(series) {
              return series.map(point => {
                return [timezoneHandler.transform(point[0] + 'Z').getTime(), point[1]];
              })
            }
            return {
              tooltip: {
                valueDecimals: 1
              },
              name: '',
              data: transformDates(data)
            };
          }),
          time: {
            useUTC: true
          }
        }
        this.destroyChart();
        this.stock = new StockChart(<any>options);
        this.statisticsLoaded = true;
      });
  }

}
