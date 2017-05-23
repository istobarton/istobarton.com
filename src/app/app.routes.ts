import { Routes } from '@angular/router';
import { ActComponent } from './act';
import { NoContentComponent } from './no-content';
import { HomeComponent } from './home/home.component';

export const ROUTES: Routes = [
  { path: '',      component: HomeComponent },
  { path: 'act', component: ActComponent },
];
