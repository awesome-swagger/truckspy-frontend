import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";

import { MessagesComponent } from "./messages.component";
import { ComposeComponent } from './compose/compose.component';
import { DetailsComponent } from './details/details.component';
import { InboxComponent } from './inbox/inbox.component';
import { SentComponent } from './sent/sent.component';
import { DraftComponent } from './draft/draft.component';
import { ArchivedComponent } from './archived/archived.component';

export const messagesRoutes: Routes = [
    {
        path: '',
        component: MessagesComponent,
        data: {
            pageTitle: 'Messages'
        },
        children: [
            {
                path: '',
                redirectTo: 'inbox',
                pathMatch: 'full'
            },
            {
                path: 'compose',
                component: ComposeComponent
            },
            {
                path: 'details',
                component: DetailsComponent
            },
            {
                path: 'inbox',
                component: InboxComponent
            },
            {
                path: 'sent',
                component: SentComponent
            },
            {
                path: 'draft',
                component: DraftComponent
            },
            {
                path: 'archived',
                component: ArchivedComponent
            }
        ]
    }
];

export const messagesRouting: ModuleWithProviders = RouterModule.forChild(messagesRoutes);
