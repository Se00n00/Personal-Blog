import { ChangeDetectionStrategy, Component, OnInit, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import articles from '../../../public/articles.json'

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  binding = ""
  article:any[] = []

  logined: WritableSignal<boolean> = signal(false)
  madelogin(){
    this.logined.set(true)
  }
  madelogout(){
    this.logined.set(false)
  }


  public articles:any[] = articles;
  getArticles(){
    this.articles = articles;
  }

  onInputChange(){
    const searchTerm = this.binding.trim().toLowerCase();
    if (!searchTerm) {
      this.getArticles(); // Reset to full list
      return;
    }

    this.articles = this.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm)
    );
  }
  
  // type = "web Design"
  // numView = 100
  // numComments = 1
  // numLiked = 10

  // items= [1,2,3,4,5]
  // current_Date = new Date()
}
