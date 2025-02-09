import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-exitpage',
  imports: [],
  templateUrl: './exitpage.component.html',
  styleUrl: './exitpage.component.css'
})
export class ExitpageComponent implements OnInit {
  constructor(private router:Router){}
  ngOnInit(): void {
    setTimeout(
      ()=>{this.router.navigate([''])},5000
    )
  }
  
}
