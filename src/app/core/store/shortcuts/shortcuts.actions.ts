import { Action } from "@ngrx/store";

export enum ShortcutsActionTypes {
  ExitEditMode = "[Shortcuts] ExitEditMode",
  FocusSearchBox = "[Shortcuts] FocusSearchBox"
}

export class ExitEditMode implements Action {
  readonly type = ShortcutsActionTypes.ExitEditMode;
}
export class FocusSearchBox implements Action {
  readonly type = ShortcutsActionTypes.FocusSearchBox;
}

export type ShortcutsActions =
  | ExitEditMode
  | FocusSearchBox;
