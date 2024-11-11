import { Component, HostListener, Input, EventEmitter, Output } from '@angular/core';
import { ApiService } from '../service/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  isOpened = false;
  phone: any;

  @Output() valueEmitter = new EventEmitter<any>(); // Event emitter to send phone to parent

  @Input() showScreen;

  constructor(
    private api: ApiService
  ) {
  }

  ngOnInit(): void {
    
  }


  

  login() {
    // Emit the phone number to the parent component
    const obj = {
      phone: this.phone,
      showScreen: this.showScreen = true
    }
    this.valueEmitter.emit(obj);
  }


  openModal(): void {
    this.isOpened = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isOpened = false;
    document.body.style.overflow = 'initial';
  }

  onLogin(): void {
    console.log("Login button clicked");
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (window.scrollY > window.innerHeight / 3 && !this.isOpened) {
      this.isOpened = true;
      this.openModal();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
