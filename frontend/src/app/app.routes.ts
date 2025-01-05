import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ArticlesComponent } from './articles/articles.component';

export const routes: Routes = [
    {path:"", component: HomeComponent},
    {path:"article", component:ArticlesComponent}
];
