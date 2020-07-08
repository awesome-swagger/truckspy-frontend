import {User} from "@app/core/services/rest.model";

/**
 * UI level model for displaying Date/time options in the preferences panel
 */
export interface DateTimeOption {
  displayName: string;
  value: DateTimeSetting;
}

/**
 * Magic strings for date-time attributes.
 */
export enum DateTimeSetting {
  picker = 'picker',
  text = 'text'
}

/**
 * Wrapper class for dealing with user date-time input preference.
 */
export class DateTimePreference {

  constructor(private user: User) {}

  readonly options = [
    {
      displayName: 'As date-time picker',
      value: DateTimeSetting.picker,
    },
    {
      displayName: 'As date-time text field',
      value: DateTimeSetting.text
    }
  ];

  get defaultOption(): DateTimeOption {
    return this.options[0];
  }

  getUserPreference(): DateTimeOption {
    if (!this.user) {
      return this.defaultOption;
    }
    const userValue = this.user.getAttribute('datetime');
    return this.options.find(opt => opt.value === userValue) || this.defaultOption;
  }
}
