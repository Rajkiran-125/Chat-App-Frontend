import { Component, Input } from '@angular/core';
import { ChatService } from '../service/chat.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent {
  isOpened = false;

  public roomId: string;
  public messageText: string;
  public messageArray: { user: string, message: string }[] = [];
  private storageArray = [];

  @Input() showScreen = false;
  public phone: string;
  @Input() currentUser;
  public selectedUser;
  public loginUser;

  public userList = [
    {
      id: 1,
      name: 'Rajkiran Jaiswar',
      phone: '8286231170',
      image: 'assets/user/user-1.png',
      roomId: {
        1: 'room-1',
        2: 'room-2',
        3: 'room-3',
        4: 'room-4'
      }
    },
    {
      id: 2,
      name: 'Neha',
      phone: '1800000',
      image: 'assets/user/user-2.png',
      roomId: {
        1: 'room-1',
        3: 'room-4',
        4: 'room-5'
      }
    },
    {
      id: 3,
      name: 'Mohit',
      phone: '10',
      image: 'assets/user/user-3.png',
      roomId: {
        1: 'room-2',
        2: 'room-4',
        4: 'room-6'
      }
    },
    {
      id: 4,
      name: 'Dianne Russell',
      phone: '9876556789',
      image: 'assets/user/user-4.png',
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
            this.messageArray = this.storageArray[storeIndex].chats;
          }, 500);
        }
      });
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
    this.chatService.joinRoom({user: username, room: roomId});
  }

  sendMessage(): void {
    console.log('Message: ',this.messageText)
    this.chatService.sendMessage({
      user: this.currentUser.name,
      room: this.roomId,
      message: this.messageText
    });

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
