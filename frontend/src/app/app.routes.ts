import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ArticlesComponent } from './articles/articles.component';
import { LoginpageComponent } from './loginpage/loginpage.component';
import { ExitpageComponent } from './exitpage/exitpage.component';
import { NotfoundComponent } from './notfound/notfound.component';

export const routes: Routes = [
    
    {path:"",title: 'articles', component: HomeComponent},
    {path:"article",title: 'article', component:ArticlesComponent},
    {path:"login",title: 'author login',component:LoginpageComponent},
    {path:"exit",title: 'logged out',component:ExitpageComponent},
    {path:"**",title: 'Opps page not found', component:NotfoundComponent}
];
