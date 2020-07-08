import { Action } from "@ngrx/store";

export enum MessagesActionTypes {
    FolderRefresh = "[Messages] Folder Refresh",
}

export class FolderRefresh implements Action {
    readonly type = MessagesActionTypes.FolderRefresh;
}
