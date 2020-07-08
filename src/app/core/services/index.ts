import { StorageService } from "./storage.service";
import {
  AuthTokenFactory,
  AuthTokenService
} from "./auth-token.service";
import { AuthService } from "./auth.service";
import { TokenInterceptor } from "./token.interceptor";
import { RestInterceptor } from "./rest.interceptor";
import { RestService, DataTableService, LocalStorageService, GlobalFunctionsService } from "./rest.service";
import { MapboxHelperService } from "./mapbox-helper.service";
import { LogoutService } from "./logout.service";
import { JsonApiService } from "./json-api.service";
import { UserService } from "./user.service";
import { ChatService } from "./chat.service";
import { NotificationService } from "./notification.service";
import { BodyService } from "./body.service";
import { LayoutService } from "./layout.service";
import { SoundService } from "./sound.service";


import * as fromVoice from './voice'

export const services = [
  StorageService,
  AuthTokenService,
  AuthService,
  TokenInterceptor,
  RestInterceptor,

  RestService, DataTableService, LocalStorageService, GlobalFunctionsService,
  MapboxHelperService,
  LogoutService,
  JsonApiService,
  UserService,
  ChatService,
  NotificationService,
  BodyService,
  LayoutService,
  SoundService,
  fromVoice.VoiceControlService,
  fromVoice.VoiceRecognitionService,
];

export * from "./storage.service";
export * from "./auth-token.service";
export * from "./auth.service";
export * from "./token.interceptor";
export * from "./rest.interceptor";
export * from "./rest.service";
export * from "./mapbox-helper.service";
export * from "./logout.service";
export * from "./json-api.service";
export * from "./user.service";
export * from "./chat.service";
export * from "./notification.service";
export * from "./body.service";
export * from "./layout.service";
export * from "./sound.service";
export * from "./voice";
