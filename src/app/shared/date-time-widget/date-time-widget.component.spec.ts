import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateTimeWidgetComponent } from './date-time-widget.component';

describe('DateTimeWidgetComponent', () => {
  let component: DateTimeWidgetComponent;
  let fixture: ComponentFixture<DateTimeWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DateTimeWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTimeWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
