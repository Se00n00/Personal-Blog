import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-create',
  imports: [RouterLink],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  conditioned:string =""
  create_quote(quote:HTMLDivElement){}
  create_image(image:HTMLDivElement){}
  create_text(text:HTMLDivElement){}
  create_heading(heading:HTMLDivElement){}
  create_sub_heading(sub_heading:HTMLDivElement){}
  create_code(code:HTMLDivElement){}
  create_code_text(code_text:HTMLDivElement){}
  create_list(list:HTMLDivElement){}
  create_tags(tags:HTMLDivElement){}
}
