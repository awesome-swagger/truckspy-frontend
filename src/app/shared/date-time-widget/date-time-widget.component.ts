import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {PickerType, SelectMode} from "ng-pick-datetime/date-time/date-time.class";
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors, Validator,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {plainToClass} from 'class-transformer';
import {LocalStorageService, User} from "@app/core/services";
import {DateTimePreference, DateTimeSetting} from "@app/core/services/date-time-preference.model";
import {select, Store} from "@ngrx/store";
import {getUser, AuthState} from "@app/core/store/auth";
import {filter, map, shareReplay, switchMap, take, tap} from "rxjs/operators";
import { combineLatest, EMPTY, Observable, of, Subscription } from "rxjs";
import * as moment from "moment";
import {Moment} from "moment";

export interface DateChangeEvent {
  value: Date | Date[]
}
@Component({
  selector: 'date-time-widget',
  templateUrl: './date-time-widget.component.html',
  styleUrls: ['./date-time-widget.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DateTimeWidgetComponent),
    multi: true,
  },
  {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => DateTimeWidgetComponent),
    multi: true
  }
  ],
})
export class DateTimeWidgetComponent implements OnInit, ControlValueAccessor, Validator{

  @Output() dateTimeChange = new EventEmitter<DateChangeEvent>();

  readonly DISPLAY_TYPE_PICKER = DateTimeSetting.picker;
  displayType$: Observable<DateTimeSetting>;
  textStrategy: TextStrategy;
  pickerStrategy: PickerStrategy;

  private _pickerType: PickerType = "both";
  private _selectMode: SelectMode = "single";
  private isInitialized: boolean;

  constructor(private localStorageService: LocalStorageService,
              private store: Store<AuthState>,
  ) { }

  ngOnInit() {
    this.displayType$ = this.store.pipe(
      select(getUser),
      take(1),
      switchMap((user: any) =>  {
        const loggedInAs: User = this.localStorageService.getLoginAs();
        let theUser: User = !!loggedInAs ? loggedInAs : plainToClass(User, user as User);
        return of(theUser);
      }),
      map((user: User) => new DateTimePreference(user).getUserPreference().value),
      shareReplay()
    );

    this.textStrategy = new TextStrategy(this.pickerType, this.selectMode);
    this.pickerStrategy = new PickerStrategy(this.pickerType, this.selectMode);
    // this.strategies.forEach(strategy => strategy.dateTimeChanges().subscribe(this.dateTimeChange))
    this.textStrategy.dateTimeChanges().subscribe(this.dateTimeChange);
    this.isInitialized = true;
  }


  @Input() set pickerType(type: PickerType) {
    this._pickerType = type;
    this.updateStrategies();
  }

  @Input() set selectMode(mode: SelectMode) {
    this._selectMode = mode;
    this.updateStrategies();
  }

  get selectMode(): SelectMode {
    return this._selectMode;
  }

  get pickerType(): PickerType {
    return this._pickerType;
  }

  registerOnChange(fn: any): void {
    this.strategies.forEach(strategy => strategy.registerOnChange(fn));
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any): void {
    this.strategies.forEach(strategy => strategy.writeValue(obj));
  }

  onModelUpdate(value: any) {
    this.strategies.forEach(strategy => strategy.onModelUpdate(value));
  }

  validate(control: AbstractControl): ValidationErrors | null {
    for (let strategy of this.strategies) {
      const errors = strategy.validate();
      if (errors) {
        return errors;
      }
    }
    return null;
  }

  private get strategies(): WidgetStrategy[] {
    return [this.textStrategy, this.pickerStrategy]
  }

  private updateStrategies() {
    if (this.isInitialized) {
      const newTextStrategy = this.textStrategy.copyWithData(this.pickerType, this.selectMode);
      const newPickerStrategy = this.pickerStrategy.copyWithData(this.pickerType, this.selectMode);
      this.textStrategy.dispose();
      this.pickerStrategy.dispose();
      this.textStrategy = newTextStrategy;
      this.pickerStrategy = newPickerStrategy;

      this.textStrategy.dateTimeChanges().subscribe(this.dateTimeChange);
    }
  }
}

interface WidgetStrategy extends ControlValueAccessor{
  onModelUpdate(value: any);
  dateTimeChanges(): Observable<DateChangeEvent>;
  validate(): ValidationErrors | null;
  copyWithData(pickerMode: PickerType, selectMode: SelectMode): WidgetStrategy;
  dispose();
}

class PickerStrategy implements WidgetStrategy {

  constructor(private pickerType: PickerType, private selectMode: SelectMode) {
  }

  model: any = "";
  private onChange: (value) => void = (value) => {};

  onModelUpdate(value: any) {
    this.writeValue(value);
    this.onChange(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any): void {
    this.model = obj;
  }

  dateTimeChanges(): Observable<any> {
    return EMPTY;
  }

  copyWithData(pickerMode: PickerType, selectMode: SelectMode): PickerStrategy {
    return this;
  }

  dispose() {

  }

  validate(): ValidationErrors | null {
    return null;
  }
}

interface InputMode {
  mask: string;
  placeholder: string;
  validator(): ValidatorFn;
  transformToModel(value: string): any;
  transformToText(model: any): string;
}

const InputModes: {[key: string]: InputMode} = {
  calendarsingle: new class implements InputMode {
    mask = '00/00/0000';
    placeholder = 'mm/dd/yyyy';
    transformToModel (value: string): any{

    }
    transformToText (model: any): string {
      return null;
    }
    validator(): ValidatorFn {
      return control => {
        return null;
      };
    }
  },
  bothsingle: new class implements InputMode {
    mask = '00/00/0000 00:00';
    placeholder = 'MM/DD/YYYY HH:mm';
    format = 'MM/DD/YYYY HH:mm';

    validator(): ValidatorFn {
      return control => {
        const date = moment(control.value, this.format);
        if (date.isValid()) {
          return null;
        }
        return {
          'invalidDate': "Invalid date entered."
        };
      };
    }

    transformToModel(value: string): any {
      return moment(value, this.format).toDate();
    }

    transformToText(model: any): string {
      return moment(model).format(this.format);
    }
  },
  timersingle: new class implements InputMode {
    mask = '00:00';
    placeholder = 'HH:MM';
    validator(): ValidatorFn {
      return control => {
        return null;
      };
    }

    transformToModel(value: string): any {
      return null; // todo
    }

    transformToText(model: any): string {
      return ""; // todo
    }
  },
  calendarrange: new class implements InputMode {
    mask = '00/00/0000 - 00/00/0000';
    placeholder = 'mm/dd/yyyy - mm/dd/yyyy';
    format = 'MM/DD/YYYY';

    validator(): ValidatorFn {
      return (control: AbstractControl) => {
        const invalidDateError = {
          'invalidDateRange': "Date range is invalid"
        };
        const value = control.value;
        if (!value) {
          return invalidDateError;
        }
        const [start, end] = this.transformToMomements(value);
        if (!(start.isValid() && end.isValid())) {
          return invalidDateError;
        }
        return null;
      }
    }

    transformToModel(value: string): any {
      return this.transformToMomements(value).map(m => m.toDate());
    }

    transformToText(model: any): string {
      return ""; // todo
    }

    private transformToMomements(value: string): Moment[] {
      const [startString, endString] = value.split('-').map(s => s.trim());
      return [startString, endString].map(s => moment(s, this.format));
    }
  },
  bothrange: new class implements InputMode {
    mask = '00/00/0000 00:00 - 00/00/0000 00:00';
    placeholder = 'MM/DD/YYYY HH:mm - MM/DD/YYYY HH:mm';
    format = 'MM/DD/YYYY HH:mm';

    validator(): ValidatorFn {
      return (control: AbstractControl) => {
        const invalidDateError = {
          'invalidDateRange': "Date range is invalid"
        };
        const value = control.value;
        if (!value) {
          return invalidDateError;
        }
        const [start, end] = this.transformToMomements(value);
        if (!(start.isValid() && end.isValid())) {
          return invalidDateError;
        }
        return null;
      }
    }

    transformToModel(value: string): any {
      return this.transformToMomements(value).map(m => m.toDate());
    }

    transformToText(model: any): string {
      return ""; //todo
    }

    private transformToMomements(value: string): Moment[] {
      const [startString, endString] = value.split('-').map(s => s.trim());
      return [startString, endString].map(s => moment(s, this.format));
    }
  }
};

class TextStrategy implements WidgetStrategy {
  inputMode: InputMode;
  inputControl: FormControl;
  private onChange: (value) => void = (value) => {};
  private dateChanges$: Observable<DateChangeEvent>;
  private subscription: Subscription;

  constructor(private pickerType: PickerType,private selectMode: SelectMode) {
    this.inputMode = InputModes[pickerType + selectMode];

    this.inputControl = new FormControl('',
      Validators.compose([Validators.required, this.inputMode.validator()])
    );

    const scope = this;
    this.dateChanges$ = combineLatest(this.inputControl.valueChanges, this.inputControl.statusChanges).pipe(
      filter(([value, status]) => status === 'VALID'),
      map(([value, status]) => scope.inputMode.transformToModel(value)),
      tap(values => scope.onChange? scope.onChange(values): null),
      map(dates => ({value: dates}))
    );

    this.subscription = this.dateChanges$.subscribe()
  }

  onModelUpdate(value: any) {
    this.writeValue(value);
    this.onChange(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any): void {
    this.inputControl.patchValue(this.stringifyValue(obj), {emitEvent: false});
  }

  dateTimeChanges(): Observable<DateChangeEvent> {
    return this.dateChanges$;
  }

  private stringifyValue(obj): string {
    if(typeof obj === 'string') {
      return obj;
    } else if (obj instanceof Date) {
      return this.inputMode.transformToText(obj);
    }
    console.log('Unknown or null input value: ' + JSON.stringify(obj));
    return null;
  }

  copyWithData(pickerType: PickerType, selectMode: SelectMode): TextStrategy {
    const ret = new TextStrategy(pickerType, selectMode);
    ret.onChange = this.onChange;
    ret.inputControl.patchValue(this.inputControl.value, {emitEvent: false});
    return ret;
  }

  dispose() {
    this.subscription.unsubscribe()
  }

  validate(): ValidationErrors | null {
    return this.inputControl.errors;
  }
}
