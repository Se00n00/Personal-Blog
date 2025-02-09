import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ArticlesComponent } from './articles/articles.component';
import { LoginpageComponent } from './loginpage/loginpage.component';
import { ExitpageComponent } from './exitpage/exitpage.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { CreateComponent } from './create/create.component';

export const routes: Routes = [
    
    {path:"",title: 'articles', component: HomeComponent},
    {path:"article/:id",title: 'article', component:ArticlesComponent},
    {path:"login",title: 'author login',component:LoginpageComponent},
    {path:"exit",title: 'logged out',component:ExitpageComponent},
    {path:"create",title: 'create a new article', component:CreateComponent},
    {path:"**",title: 'Opps page not found', component:NotfoundComponent}
];
