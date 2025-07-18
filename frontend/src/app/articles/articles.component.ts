import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button'
import { FieldsetModule } from 'primeng/fieldset';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import firstblog from '../../../public/firstblog.json'

@Component({
  selector: 'app-articles',
  imports: [MatIconModule, CommonModule, ButtonModule,FieldsetModule,RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})

export class ArticlesComponent {
  like(){}
  comment_icon = 'comment';
  showComments:boolean = false;
  comment(){
    if(this.comment_icon === 'close'){
      this.comment_icon  = 'comment'
      this.showComments = false
    }
    else{
      this.showComments = true
      this.comment_icon= 'close'
    }
  }
  upCommentCrousal(){}
  downCommentCrousal(){}


  itemId: string | null = '';
  article:any;
  copied = signal("copy")

  constructor(private route: ActivatedRoute,private router:Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.itemId = params.get('id'); // Get the 'id' parameter
      this.article = firstblog.filter(item => item.meta.id === this.itemId)[0]

      if(firstblog.filter(item => item.meta.id === this.itemId).length == 0){
        this.router.navigate(['blog does not exits'])
      }
      // this.router.navigate(['/item', iRouter.navem.id]);
      // console.log(firstblog)

      // console.log('Item ID:', this.itemId);
    });
  }
  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
    alert(`Link Copied: ${url}`)
  }
  copycontent(codeContent:string){
    navigator.clipboard.writeText(codeContent);
    this.copied.update(value => value="copied")
  }

  scrolltoid(id: any) {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: 'smooth', // Enables smooth scrolling
      block: 'start',     // Scrolls to the top of the element
      inline: 'nearest'   // Optional: aligns horizontally nearest edge
    });
  }
}
