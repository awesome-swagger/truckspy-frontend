import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { StockChart } from 'angular-highcharts';

import { RestService, DateUtil, DwellStatsHelper } from '@app/core/services'
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-dwellstats',
  templateUrl: './dwellstats.component.html',
  styleUrls: ['./dwellstats.component.css']
})
export class DwellStatsComponent implements OnInit, OnDestroy {

  locationId: string;

  period: Date[] = [null, null];
  periodCache: Date[] = [null, null];
  onPeriodChange(state) {
    let valueChanged = DateUtil.compareDate(this.periodCache[0], state.value[0]) != 0 ||
      DateUtil.compareDate(this.periodCache[1], state.value[1]) != 0;

    let periodDefined = !!state.value[0] && !!state.value[1];
    if (valueChanged && periodDefined) {
      this.periodCache = [...state.value];
      this.loadStatistics();
    }
  }

  /**
   * Statistics logic.
   */
  statistics: DwellStatsHelper;
  emptyOptions = {
    rangeSelector: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    title: {
      text: ''
    },
    series: []
  }
  stock: StockChart = new StockChart(this.emptyOptions);

  /**
   * Constructor to instantiate an instance of DwellStatsComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private dateService: DateService) { }

  ngOnInit() {
    this.locationId = this.route.snapshot.paramMap.get("id");
    this.period = [new Date(), new Date()];
    this.loadStatistics();
  }

  destroyChart() {
    if (!!this.stock) {
      this.stock.destroy();
    }
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  loadStatistics() {
    let startDate: string = this.dateService.transform2OdometerDate(this.period[0]);
    let endDate: string = this.dateService.transform2OdometerDate(this.period[1]);

    this.restService.getDwellStatsFor(this.locationId, startDate, endDate)
      .subscribe(dwellStats => {
        this.statistics = new DwellStatsHelper(dwellStats);

        let options = {
          chart: {
            type: "column"
          },
          plotOptions: {
            series: {
              minPointLength: 3,
              // borderWidth: 1,
              // borderColor: 'black',
              groupPadding: 0
            }
          },
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
              text: 'minutes'
            }
          },
          title: {
            text: ''
          },
          series: this.statistics.getSeriesData().map(function (data: any) {
            return {
              // findNearestPointBy: 'xy',
              tooltip: {
                valueDecimals: 0
              },
              name: '',
              data: data
            };
          })
        }
        this.destroyChart();
        this.stock = new StockChart(<any>options);
      });
  }

}
