import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ArticlesComponent } from './articles/articles.component';
import { LoginpageComponent } from './loginpage/loginpage.component';
import { ExitpageComponent } from './exitpage/exitpage.component';
import { NotfoundComponent } from './notfound/notfound.component';

export const routes: Routes = [
    {path:"", component: HomeComponent},
    {path:"article", component:ArticlesComponent},
    {path:"login",component:LoginpageComponent},
    {path:"exit", component:ExitpageComponent},
    {path:"**", component:NotfoundComponent}
];
