import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthTokenService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  error: string | null = null;
  loading = false;

  constructor(private auth: AuthTokenService, private router: Router) {}

  submit() {
    this.error = null;
    this.loading = true;

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['chat'], { replaceUrl: true });
      },
      error: (e) => {
         this.router.navigateByUrl('/');
        this.loading = false;
        this.error = e?.error?.message ?? 'Login fallito';
      }
    });
  }
}
