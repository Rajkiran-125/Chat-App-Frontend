import { Component, HostListener, ViewChild, AfterViewChecked, ElementRef, OnDestroy } from '@angular/core';
import { ChatService } from './service/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewChecked {

  @ViewChild('msgBody') private msgBody!: ElementRef;
  title = 'chat-app';

  isOpened = false;
  version: string = 'V.0.0.2'

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

  // ngOnInit(): void {
  //   this.startTimer();
  
  //   // Subscribe to new messages and update message array and local storage only once per message
  //   this.chatService.getMessage().subscribe((data: { user: string; room: string; message: string }) => {
  //     if (data.room === this.roomId) {
  //       const newMessage = {
  //         user: data.user,
  //         message: data.message,
  //         dateTime: new Date().toISOString()
  //       };
  
  //       // Add the message to the messageArray for display
  //       this.messageArray.push(newMessage);
  
  //       // Check for duplication before updating storage
  //       this.updateStorageIfNotExists(newMessage);
  
  //       // Scroll to the bottom after adding the message
  //       setTimeout(() => this.scrollToBottom(), 100);
  //     }
  //   });
  
  //   // Load existing messages from storage when component initializes
  //   this.loadMessagesFromStorage();
  // }

  ngOnInit(): void {
    this.startTimer();
  
    // Subscribe to new messages, processing only those matching the current roomId
    this.chatService.getMessage().subscribe((data: { user: string; room: string; message: string }) => {
      // Only process messages for the selected user's room
      if (data.room === this.roomId) {
        const newMessage = {
          user: data.user,
          message: data.message,
          dateTime: new Date().toISOString()
        };
  
        // Add the message to messageArray and update local storage if not a duplicate
        this.messageArray.push(newMessage);
        this.updateStorageIfNotExists(newMessage);
  
        // Scroll to the bottom after adding the message
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  
    // Load existing messages from storage on component initialization
    this.loadMessagesFromStorage();
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
  
  updateStorageIfNotExists(newMessage: { user: string; message: string; dateTime: string }): void {
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === this.roomId);
  
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
    setTimeout(() => {
      this.scrollToBottom();
    }, 10);
  }


  sendMessage(): void {

    if (!this.messageText.trim()) return;

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
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === this.roomId);

    const newMessage = {
      user: this.currentUser.name,
      message: this.messageText,
      dateTime: this.dateTime
    };

    if (storeIndex > -1) {
      this.storageArray[storeIndex].chats.push(newMessage);
    } else {
      const updateStorage = {
        roomId: this.roomId,
        chats: [newMessage]
      };
      console.log(updateStorage);
      this.storageArray.push(updateStorage);
    }

    this.chatService.setStorage(this.storageArray);
    this.messageText = '';
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

}
