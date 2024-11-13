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
  tab: string = 'login';

  userName;
  phoneNumber;
  selectedProfilePic: string | null = null;

  profilePics = [
    'https://bootdey.com/img/Content/avatar/avatar1.png',
    'https://bootdey.com/img/Content/avatar/avatar2.png',
    'https://bootdey.com/img/Content/avatar/avatar3.png',
    'https://bootdey.com/img/Content/avatar/avatar4.png',
    'https://bootdey.com/img/Content/avatar/avatar5.png',
    'https://bootdey.com/img/Content/avatar/avatar6.png'
  ]



  @Output() valueEmitter = new EventEmitter<any>(); // Event emitter to send phone to parent

  @Input() showScreen;

  constructor(
    private api: ApiService
  ) { }

  selectProfilePic(img: string) {
    this.selectedProfilePic = img;
    console.log("this.selectProfilePic", this.selectProfilePic)
  }

  signUp() {
    console.log('signUp');

    if (this.userName && this.phoneNumber && this.selectedProfilePic) {

      let json_data = {
        userName: this.userName,
        phone: this.phoneNumber,
        profilePic: this.selectedProfilePic
      }
      let obj = {
        "data": {
          "spname": "sp_ca_signUpUser",
          "parameters": {
            "json_data": json_data
          }
        }
      };

      this.api.post('index/json', obj).subscribe(res => {
        console.log(res['results'].data[0].results);
        alert(res['results'].data[0].results);
        this.tab = 'login'
        this.userName = '';
        this.phoneNumber = '';
        this.selectedProfilePic = '';
      });
    }else{
      alert('Please fill the require field')
    }
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
