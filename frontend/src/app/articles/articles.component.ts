import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button'
import { FieldsetModule } from 'primeng/fieldset';

@Component({
  selector: 'app-articles',
  imports: [MatIconModule, CommonModule, ButtonModule,FieldsetModule,RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})

export class ArticlesComponent {

  type = "web Design"
  numView = 100
  numComments = 1
  numLiked = 10
  conditioned:string =""

  quoteText = "This iS a quote"
  ImageTitle = "Just A Title"
  imageSrc = "https://c4.wallpaperflare.com/wallpaper/292/446/516/ultra-wide-photography-wallpaper-preview.jpg"
  text = "Sample Text"
  headingText = "Heading"
  subHeadingText = "subHeading"
  listItem = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis, ea?"
  tagName = "Deep Learning"
  items = ["a","a","a","a","a","a","a","a","a","a","a","a","a"]

  codeLanguage="typescript"
  code = "#include stdio.h int main() printf()"
}
