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
  loader: boolean = false;

  userName;
  phoneNumber;
  selectedProfilePic: string | null = null;
  userList: any;

  profilePics = [
    'https://bootdey.com/img/Content/avatar/avatar1.png',
    'https://bootdey.com/img/Content/avatar/avatar7.png',
    'https://bootdey.com/img/Content/avatar/avatar3.png',
    'https://bootdey.com/img/Content/avatar/avatar8.png',
    'https://bootdey.com/img/Content/avatar/avatar5.png',
    'https://bootdey.com/img/Content/avatar/avatar6.png'
  ]



  @Output() valueEmitter = new EventEmitter<any>(); // Event emitter to send phone to parent

  @Input() showScreen;

  constructor(
    private api: ApiService
  ) { }

  ngOnInit(): void {
    const checkUser = JSON.parse(localStorage.getItem('user'));
    if (checkUser) {
      {
        const obj = {
          phone: checkUser,
          showScreen: this.showScreen = true
        }
        this.valueEmitter.emit(obj);
      }
    }
  }

  selectProfilePic(img: string) {
    this.selectedProfilePic = img;
    console.log("this.selectProfilePic", this.selectProfilePic)
  }

  signUp() {
    console.log('signUp');
    this.loader = true;
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
        if (res['results'].data[0].results == 'Data insrted successfully') {

          this.getUserRoomIdAndDetailsByPhone();
          console.log(res['results'].data[0].results);
          this.loader = false;
          alert('Signup success');
          this.tab = 'login';
          this.phone = this.phoneNumber;
          this.userName = '';
          this.phoneNumber = '';
          this.selectedProfilePic = '';
        } else if (res['results'].data[0].results == 'User already exist') {
          this.loader = false;
          this.tab = 'login';
          this.userName = '';
          this.phone = this.phoneNumber;
          this.phoneNumber = '';
          this.selectedProfilePic = '';
          alert('User already exist');
        }
      });
    } else {
      alert('Please fill the require field');
      this.loader = false;
    }
  }


  getUserRoomIdAndDetailsByPhone() {
    let obj = {
      "data": {
        "spname": "sp_ca_getUserList",
        "parameters": {
          "flag": "withPhone"
        }
      }
    };

    this.api.post('index/json', obj).subscribe(res => {

      // {
      //   id: 4,
      //   name: 'Kamlesh',
      //   phone: '20',
      //   image: 'https://bootdey.com/img/Content/avatar/avatar4.png',
      //   roomId: {
      //     1: 'room-3',
      //     2: 'room-5',
      //     3: 'room-6'
      //   }
      // }
      if (res['code'] === 200) {
        const rawData = res['results'].data;
        if (rawData && rawData.length > 0) {
          // Build user list object with room mapping
          let userList = {};
          rawData.forEach(item => {
            if (!userList[item.UserId]) {
              userList[item.UserId] = {
                id: item.UserId,
                name: item.UserName,
                phone: item.Phone,
                image: item.ProfilePic,
                roomId: {}
              };
            }
            if (item.RoomUserId && item.RoomId) {
              userList[item.UserId].roomId[item.RoomUserId] = item.RoomId;
            }
          });

          this.userList = Object.values(userList);
          localStorage.setItem('userList', JSON.stringify(this.userList));
        }
      } else {
        console.log('UserName data get Failed >>>>>');
      }
      console.log('UserName data get >>>>>>', res);
    });
  }


  login() {
    // Emit the phone number to the parent component
    this.loader = true;
    this.userList = JSON.parse(localStorage.getItem('userList'));

    if (this.userList) {

      const matchingUser = this.userList.find(user => user.phone === this.phone);

      if (matchingUser) {
        console.log('Login successful', matchingUser);
        // Proceed with login actions
        const obj = {
          phone: this.phone,
          showScreen: this.showScreen = true
        }
        localStorage.setItem('user', JSON.stringify(this.phone));
        this.valueEmitter.emit(obj);
        this.loader = false;
      } else {

        alert('Login failed: No user with this phone number found')
        console.log('Login failed: No user with this phone number found');
        this.loader = false;
        // Handle login failure
      }
    } else {

      alert('Login failed: No user with this phone number found')
      console.log('Login failed: No user with this phone number found');
      this.loader = false;
      // Handle login failure
    }
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
