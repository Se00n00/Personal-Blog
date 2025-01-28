import { ChangeDetectionStrategy, Component, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { signal } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  logined: WritableSignal<boolean> = signal(false)
  madelogin(){
    this.logined.set(true)
  }
  madelogout(){
    this.logined.set(false)
  }
  
  type = "web Design"
  numView = 100
  numComments = 1
  numLiked = 10

  items= [1,2,3,4,5]
  current_Date = new Date()
}
