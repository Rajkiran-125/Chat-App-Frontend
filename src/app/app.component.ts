import { Component, HostListener } from '@angular/core';
import { ChatService } from './service/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chat-app';

  isOpened = false;

  public roomId: string;
  public messageText: string;
  public messageArray: { user: string, message: string }[] = [];
  private storageArray = [];

  public showScreen = false;
  public phone: string;
  public currentUser;
  public selectedUser;
  public loginUser;

  menuToggled = true;
  replyText = '';

  public userList = [
    {
      id: 1,
      name: 'Rajkiran Jaiswar',
      phone: '8286231170',
      image: 'https://bootdey.com/img/Content/avatar/avatar1.png',
      roomId: {
        2: 'room-1',
        3: 'room-4',
        4: 'room-3'
      }
    },
    {
      id: 2,
      name: 'Mohit',
      phone: '18',
      image: 'https://bootdey.com/img/Content/avatar/avatar2.png',
      roomId: {
        1: 'room-1',
        3: 'room-2',
        4: 'room-5'
      }
    },
    {
      id: 3,
      name: 'Neha',
      phone: '10',
      image: 'https://bootdey.com/img/Content/avatar/avatar3.png',
      roomId: {
        1: 'room-4',
        2: 'room-2',
        4: 'room-6'
      }
    },
    {
      id: 4,
      name: 'Dianne Russell',
      phone: '20',
      image: 'https://bootdey.com/img/Content/avatar/avatar4.png',
      roomId: {
        1: 'room-3',
        2: 'room-5',
        3: 'room-6'
      }
    }
  ];

  constructor(
    private chatService: ChatService
  ) {
  }

  ngOnInit(): void {
    console.log('this.showScreen', this.showScreen)
    this.chatService.getMessage()
      .subscribe((data: { user: string, room: string, message: string }) => {
        // this.messageArray.push(data);
        if (this.roomId) {
          setTimeout(() => {
            this.storageArray = this.chatService.getStorage();
            const storeIndex = this.storageArray
              .findIndex((storage) => storage.roomId === this.roomId);
            console.log('storageArray', this.storageArray)
            console.log('storeIndex', storeIndex);
            // this.messageArray = this.storageArray[storeIndex].chats;
            if (storeIndex > -1) {
              this.messageArray = this.storageArray[storeIndex].chats.push({
                user: data.user,
                message: data.message
              });
            } else {
              const updateStorage = {
                roomId: data.room,
                chats: [{
                  user: data.user,
                  message: data.message
                }]
              };
              console.log(updateStorage);
              this.storageArray.push(updateStorage);
              this.messageArray = this.storageArray;
              this.chatService.setStorage(this.storageArray);
            }
          }, 500);
        }
      });
  }

  valueRecievedOutput(value) {
    console.log('value', value);
    this.phone = value.phone;
    this.showScreen = value.showScreen;
    this.login();
  }

  toggleMenu() {
    this.menuToggled = !this.menuToggled;
  }

  login(): void {

    this.currentUser = this.userList.find(user => user.phone === this.phone.toString());
    this.loginUser = this.userList.filter((user) => user.phone == this.phone.toString());
    this.userList = this.userList.filter((user) => user.phone !== this.phone.toString());

    console.log(this.loginUser);
    if (this.currentUser) {
      this.showScreen = true;
      console.log('this.showScreen', this.showScreen)
    }

  }

  selectUserHandler(phone: string): void {
    this.selectedUser = this.userList.find(user => user.phone === phone);
    this.roomId = this.selectedUser.roomId[this.currentUser.id];
    this.messageArray = [];

    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray
      .findIndex((storage) => storage.roomId === this.roomId);

    if (storeIndex > -1) {
      this.messageArray = this.storageArray[storeIndex].chats;
    }

    this.join(this.currentUser.name, this.roomId);
  }

  join(username: string, roomId: string): void {
    this.chatService.joinRoom({ user: username, room: roomId });
  }

  sendMessage(): void {
    this.chatService.sendMessage({
      user: this.currentUser.name,
      room: this.roomId,
      message: this.messageText
    });

    if (this.replyText.trim()) {
      console.log('Message sent:', this.replyText);
      this.replyText = ''; // Clear the textarea
    }

    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray
      .findIndex((storage) => storage.roomId === this.roomId);

    if (storeIndex > -1) {
      this.storageArray[storeIndex].chats.push({
        user: this.currentUser.name,
        message: this.messageText
      });
    } else {
      const updateStorage = {
        roomId: this.roomId,
        chats: [{
          user: this.currentUser.name,
          message: this.messageText
        }]
      };
      console.log(updateStorage)
      this.storageArray.push(updateStorage);
    }

    this.chatService.setStorage(this.storageArray);
    this.messageText = '';
  }



}
