import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { messagesRouting } from './messages.routing';
import { MessagesComponent } from './messages.component';
import { InboxComponent } from './inbox/inbox.component';
import { SentComponent } from './sent/sent.component';
import { DraftComponent } from './draft/draft.component';
import { ArchivedComponent } from './archived/archived.component';
import { ComposeComponent } from './compose/compose.component';
import { DetailsComponent } from './details/details.component';
import { FolderSelectorComponent } from './shared/folder-selector.component';
import { MessageLabelsComponent } from './shared/message-labels.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { MessagesService } from './shared/messages.service';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';

@NgModule({
  declarations: [MessagesComponent, InboxComponent, SentComponent, DraftComponent, ArchivedComponent, ComposeComponent,
    DetailsComponent, FolderSelectorComponent, MessageLabelsComponent
  ],
  imports: [
    NgSelectModule,
    CommonModule,
    messagesRouting,
    SharedModule,
    FeaturesSharedModule,
    Select2Module
  ],
  providers: [MessagesService]
})
export class MessagesModule { }
