import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-loginpage',
  imports: [FormsModule],
  templateUrl: './loginpage.component.html',
  styleUrl: './loginpage.component.css'
})
export class LoginpageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  username = '';
  password = '';
  loginError: string | null = null;
  busy = false;

  onLogin() {
    if (!this.username || !this.password || this.busy) {
      return;
    }
    this.busy = true;
    this.loginError = null;
    this.auth.login(this.username, this.password).subscribe({
      next: (author) => {
        this.busy = false;
        if (author) {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.loginError = 'Invalid username or password.';
        }
      },
      error: () => {
        this.busy = false;
        this.loginError = 'Could not reach the API. Is it running?';
      }
    });
  }
}
