import { Component, HostListener, ViewChild, AfterViewChecked, ElementRef, OnDestroy } from '@angular/core';
import { ChatService } from './service/chat.service';
import { ApiService } from './service/api.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewChecked {

  @ViewChild('msgBody') private msgBody!: ElementRef;
  title = 'chat-app';

  isOpened = false;
  version: string = 'V.0.0.12'
  search: any;

  public roomId: string;
  public messageText: string;
  public messageArray: { user: string, message: string, dateTime: string }[] = [];
  private storageArray = [];

  public showScreen = false;
  public phone: string;
  public currentUser;
  public selectedUser;
  public loginUser;
  previousMessageCount = 0;
  dateTime = new Date();
  private timer: any;
  userList: any;
  menuToggled = true;
  replyText = '';

  private intervalId: any;
  private apiSubscriptionPortfolio: Subscription | null = null;
  private apiSubscriptionChatApp: Subscription | null = null;

  userStatusMap = new Map<string, string>(); // Key: Username, Value: Status (online/offline)

  // public userList = [
  //   {
  //     id: 1,
  //     name: 'Rajkiran Jaiswar',
  //     phone: '8286231170',
  //     image: 'https://bootdey.com/img/Content/avatar/avatar1.png',
  //     roomId: {
  //       2: 'room-1',
  //       3: 'room-4',
  //       4: 'room-3'
  //     }
  //   },
  //   {
  //     id: 2,
  //     name: 'Mohit',
  //     phone: '18',
  //     image: 'https://bootdey.com/img/Content/avatar/avatar2.png',
  //     roomId: {
  //       1: 'room-1',
  //       3: 'room-2',
  //       4: 'room-5'
  //     }
  //   },
  //   {
  //     id: 3,
  //     name: 'Neha',
  //     phone: '10',
  //     image: 'https://bootdey.com/img/Content/avatar/avatar3.png',
  //     roomId: {
  //       1: 'room-4',
  //       2: 'room-2',
  //       4: 'room-6'
  //     }
  //   },
  //   {
  //     id: 4,
  //     name: 'Kamlesh',
  //     phone: '20',
  //     image: 'https://bootdey.com/img/Content/avatar/avatar4.png',
  //     roomId: {
  //       1: 'room-3',
  //       2: 'room-5',
  //       3: 'room-6'
  //     }
  //   }
  // ];

  constructor(
    private chatService: ChatService,
    private api: ApiService
  ) {
  }

  startTimer(): void {
    this.timer = setInterval(() => {
      this.dateTime = new Date(this.dateTime.getTime() + 1000); // Add 1 second
    }, 1000);
  }

  ngAfterViewChecked() {
    this.scrollIfNewMessage();
  }
  scrollIfNewMessage(): void {
    if (this.messageArray.length > this.previousMessageCount) {
      this.scrollToBottom();
      this.previousMessageCount = this.messageArray.length;
    }
  }

  scrollToBottom(): void {
    try {
      this.msgBody.nativeElement.scrollTop = this.msgBody.nativeElement.scrollHeight;
    } catch (err) {
      console.error("Error scrolling to bottom:", err);
    }
  }


  ngOnInit(): void {
    this.startTimer();
    // this.getUserList();
    this.getUserRoomIdAndDetailsByPhone();
    // Subscribe to new messages, but only process them if they match the current roomId
    this.chatService.getMessage().subscribe((data: { user: string; room: string; message: string, dateTime: string }) => {
      // Ensure the incoming message is for the selected user's room
      if (data.room === this.roomId) {
        const newMessage = {
          user: data.user,
          message: data.message,
          dateTime: data.dateTime
        };

        // Add the message to the messageArray and update storage
        this.messageArray.push(newMessage);
        this.updateStorageIfNotExists(newMessage, data.room);

        // Scroll to the bottom after adding the message
        setTimeout(() => this.scrollToBottom(), 100);
      } else {
        const newMessage = {
          user: data.user,
          message: data.message,
          dateTime: data.dateTime
        };
        this.updateStorageIfNotExists(newMessage, data.room);
      }
    });

    this.chatService.getUserStatus().subscribe((data: { username: string; status: string }) => {
      this.userStatusMap.set(data.username, data.status);
      console.log(`${data.username} is now ${data.status}`);
      console.log('userStatusMap >>>> ', this.userStatusMap);
      this.updateUserStatus();
    });

    this.intervalId = setInterval(() => {
      this.apiSubscriptionPortfolio = this.api.porfolioApi().subscribe(
        (response) => {
          // console.log('apiSubscriptionPortfolio response:', response);
        },
        (error) => {
          console.error('apiSubscriptionPortfolio error:', error);
        }
      );
      this.apiSubscriptionChatApp = this.api.porfolioApi().subscribe(
        (response) => {
          // console.log('apiSubscriptionChatApp response:', response);
        },
        (error) => {
          console.error('apiSubscriptionChatApp error:', error);
        }
      );
    }, 60000); // 60000 milliseconds = 1 minute

    // Load existing messages from storage when component initializes
    this.loadMessagesFromStorage();
  }
  updateUserStatus(): void {
    if (!this.userList || !this.userStatusMap) return;

    this.userList.forEach(user => {
      if (this.userStatusMap.has(user.name)) { // Assuming 'name' is the key to match usernames
        user.status = this.userStatusMap.get(user.name); // Update the status
      }
    });
    // Optionally save the updated userList to localStorage or another storage medium
    localStorage.setItem('userList', JSON.stringify(this.userList));
    // this.getUserRoomIdAndDetailsByPhone();

    // Update related properties dynamically
    this.refreshRelatedUserProperties();
  }

  refreshRelatedUserProperties(): void {
    // Update currentUser
    // if (this.phone) {
    //   this.currentUser = this.userList.find(user => user.phone === this.phone.toString());
    // }
    // this.selectedUser = this.userList.find(user => user.phone === this.phone);
    // Update loginUser
    if (this.phone) {
      this.loginUser = this.userList.filter(user => user.phone === this.phone.toString());
    }

    // Update userListWithFilterUser
    if (this.currentUser) {
      const currentUserRoomIds = Object.keys(this.currentUser.roomId || {});
      this.userListWithFilterUser = this.userList.filter(user =>
        currentUserRoomIds.includes(user.id.toString()) && user.phone !== this.currentUser.phone
      );
    }

    console.log('Updated currentUser:', this.currentUser);
    console.log('Updated loginUser:', this.loginUser);
    console.log('Updated userListWithFilterUser:', this.userListWithFilterUser);
  }


  getUserList() {
    let obj = {
      "data": {
        "spname": "sp_ca_getUserList",
        "parameters": {
        }
      }
    }
    this.api.post('index/json', obj).subscribe(res => {
      if (res['code'] == 200) {
        if (res['results'].data && res['results'].data.length > 0) {
          this.userList = res['results'].data;
          localStorage.setItem('userList', JSON.stringify(res['results'].data));
        } else {

        }
      } else {
        console.log('User data get Failed >>>>>')
      }
      // console.log('User data get >>>>>>', res);
    })
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
      if (res['code'] === 200) {
        const rawData = res['results'].data;
        if (rawData && rawData.length > 0) {
          let userList = {};
          rawData.forEach(item => {
            if (!userList[item.UserId]) {
              userList[item.UserId] = {
                id: item.UserId,
                name: item.UserName,
                phone: item.Phone,
                image: item.ProfilePic,
                status: "",
                roomId: {}
              };
            }
            if (item.RoomUserId && item.RoomId) {
              userList[item.UserId].roomId[item.RoomUserId] = item.RoomId;
            }
          });

          this.userList = Object.values(userList);
          localStorage.setItem('userList', JSON.stringify(this.userList));

          if (this.userList && this.phone) {
            this.currentUser = this.userList.find(user => user.phone === this.phone.toString());
            this.loginUser = this.userList.filter((user) => user.phone == this.phone.toString());
            this.userList = this.userList.filter((user) => user.phone !== this.phone.toString());
          }
        }
      } else {
        console.log('UserName data get Failed >>>>>');
      }
      // console.log('UserName data get >>>>>>', res);
    });
  }

  getUserRoomIdAndDetailsPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      const obj = {
        data: {
          spname: 'sp_ca_getUserList',
          parameters: { flag: 'withPhone' }
        }
      };

      this.api.post('index/json', obj).subscribe(
        (res) => {
          if (res['code'] === 200) {
            const rawData = res['results'].data;
            if (rawData && rawData.length > 0) {
              let userList = {};
              rawData.forEach((item) => {
                if (!userList[item.UserId]) {
                  userList[item.UserId] = {
                    id: item.UserId,
                    name: item.UserName,
                    phone: item.Phone,
                    image: item.ProfilePic,
                    status: "",
                    roomId: {}
                  };
                }
                if (item.RoomUserId && item.RoomId) {
                  userList[item.UserId].roomId[item.RoomUserId] = item.RoomId;
                }
              });

              this.userList = Object.values(userList);
              localStorage.setItem('userList', JSON.stringify(this.userList));

              if (this.userList && this.phone) {
                this.currentUser = this.userList.find(
                  (user) => user.phone === this.phone.toString()
                );
                this.loginUser = this.userList.filter(
                  (user) => user.phone == this.phone.toString()
                );
                // this.userList = this.userList.filter(
                //   (user) => user.phone !== this.phone.toString()
                // );
              }
            }
            resolve(); // Resolve the promise
          } else {
            console.error('UserName data get failed.');
            reject('Failed to fetch user data');
          }
        },
        (err) => {
          console.error('API Error:', err);
          reject(err);
        }
      );
    });
  }


  loadMessagesFromStorage(): void {
    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === this.roomId);

    // If roomId exists in storage, set messageArray to its chats
    if (storeIndex > -1) {
      this.messageArray = this.storageArray[storeIndex].chats;
    } else {
      this.messageArray = []; // Clear messages if no matching roomId is found
    }

    // Scroll to the bottom after loading messages
    setTimeout(() => this.scrollToBottom(), 100);
  }

  updateStorageIfNotExists(newMessage: { user: string; message: string; dateTime: string }, roomId): void {
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === roomId);

    if (storeIndex > -1) {
      // Check for duplicate messages by matching message content and dateTime
      const exists = this.storageArray[storeIndex].chats.some(
        (chat) => chat.message === newMessage.message && chat.dateTime === newMessage.dateTime
      );
      if (!exists) {
        this.storageArray[storeIndex].chats.push(newMessage); // Add if not duplicate
      }
    } else {
      // Create a new room entry if roomId is not found
      this.storageArray.push({
        roomId: this.roomId,
        chats: [newMessage]
      });
    }

    // Update localStorage with the new state
    this.chatService.setStorage(this.storageArray);
  }

  valueRecievedOutput(value) {
    // console.log('value', value);
    this.phone = value.phone;
    this.showScreen = value.showScreen;
    this.login();
  }

  toggleMenu() {
    this.menuToggled = !this.menuToggled;
  }

  login(): void {
    this.getUserRoomIdAndDetailsPromise().then(() => {
      this.currentUser = this.userList.find((user) => user.phone === this.phone.toString());
      this.loginUser = this.userList.filter((user) => user.phone == this.phone.toString());
      this.userList = this.userList.filter((user) => user.phone !== this.phone.toString());

      // console.log(this.loginUser);
      if (this.currentUser) {
        this.showScreen = true;
        console.log('this.showScreen', this.showScreen);
      }
      setTimeout(() => {
        this.filteredUserList();
      }, 10);
    });


  }

  selectUserHandler(phone: string): void {

    this.getUserRoomIdAndDetailsByPhone();
    let userList = JSON.parse(localStorage.getItem('userList'));

    this.selectedUser = userList.find(user => user.phone === phone);
    this.roomId = this.selectedUser.roomId[this.currentUser.id];
    this.messageArray = [];

    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray
      .findIndex((storage) => storage.roomId === this.roomId);

    if (storeIndex > -1) {
      this.messageArray = this.storageArray[storeIndex].chats;
    }
    this.join(this.currentUser.name, this.roomId);
    // console.log('storageArray""""""" ', this.storageArray)
  }

  selectUserHandlerForSendMsg(phone: string): void {
    this.getUserRoomIdAndDetailsPromise().then(() => {
      const userList = JSON.parse(localStorage.getItem('userList') || '[]');

      this.selectedUser = userList.find(user => user.phone === phone);
      if (!this.selectedUser || !this.currentUser) {
        console.error('Selected user or current user not found.');
        return;
      }

      this.roomId = this.selectedUser.roomId[this.currentUser.id];
      this.messageArray = [];

      this.storageArray = this.chatService.getStorage();
      const storeIndex = this.storageArray.findIndex(
        (storage) => storage.roomId === this.roomId
      );

      if (storeIndex > -1) {
        this.messageArray = this.storageArray[storeIndex].chats;
      }
      this.join(this.currentUser.name, this.roomId);
    });
  }


  join(username: string, roomId: string): void {
    this.chatService.joinRoom({ user: username, room: roomId });
    setTimeout(() => {
      this.scrollToBottom();
    }, 10);
  }


  sendMessage(): void {

    this.selectUserHandlerForSendMsg(this.selectedUser.phone);
    // this.selectedUser = this.userList.find(user => user.phone === this.selectedUser.phone);
    if (!this.messageText.trim()) return;

    const date = this.dateTime.toISOString();

    this.chatService.sendMessage({
      user: this.currentUser.name,
      room: this.roomId,
      message: this.messageText,
      dateTime: date
    });

    if (this.replyText.trim()) {
      // console.log('Message sent:', this.replyText);
      this.replyText = ''; // Clear the textarea
    }

    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === this.roomId);

    const newMessage = {
      user: this.currentUser.name,
      message: this.messageText,
      dateTime: date
    };

    if (storeIndex > -1) {
      this.storageArray[storeIndex].chats.push(newMessage);
    } else {
      const updateStorage = {
        roomId: this.roomId,
        chats: [newMessage]
      };
      // console.log(updateStorage);
      this.storageArray.push(updateStorage);
    }

    this.chatService.setStorage(this.storageArray);
    this.messageText = '';
  }

  createRoom(user) {

    this.search = '';

    let userName = this.userListWithFilterUser.find(res => res.name == user.name && res.phone == user.phone);
    if (userName) {
      this.selectUserHandler(user.phone);
      return;
    }

    const datePart = new Date().getTime().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 7);
    const room_id = `RoomId-${datePart}-${randomPart}`;

    let obj = {
      "data": {
        "spname": "sp_ca_createRoomId",
        "parameters": {
          "userId": this.currentUser.id,
          "userName": this.currentUser.name,
          "roomUserId": user.id,
          "roomUserName": user.name,
          "roomId": room_id
        }
      }
    }
    this.api.post('index/json', obj).subscribe(res => {
      // console.log(res['results'].data[0].results);
      this.getUserRoomIdAndDetailsPromise().then(() => {
        this.roomId = room_id
        setTimeout(() => {
          this.filteredUserList();
        }, 10);
        // alert(res['results'].data[0].results);
      });
    });
  }

  // Function to filter users based on currentUser's id
  userListWithFilterUser = [];
  filteredUserList() {
    const currentUserRoomIds = Object.keys(this.currentUser?.roomId);

    this.userListWithFilterUser = this.userList.filter(user =>
      currentUserRoomIds.includes(user.id.toString()) && user.phone !== this.currentUser.phone
    );
    // let filterUser = this.userList.filter(user =>
    //   Object.keys(user.roomId).some(roomId => currentUserRoomIds.includes(roomId))
    // );
    // this.userListWithFilterUser = filterUser.filter((user) => user.phone !== this.phone.toString());
    // console.log('userListWithFilterUser', this.userListWithFilterUser)
  }
  logout() {
    localStorage.removeItem('user');
    this.showScreen = false;
  }
  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    // Clear the interval and unsubscribe to prevent memory leaks
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.apiSubscriptionPortfolio) {
      this.apiSubscriptionPortfolio.unsubscribe();
    }
    if (this.apiSubscriptionChatApp) {
      this.apiSubscriptionChatApp.unsubscribe();
    }
  }
}


