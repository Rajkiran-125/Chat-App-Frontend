import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient
  ) { }

  post(endPoint,obj){
    return this.http.post(environment.baseUrl+endPoint,obj)
  }

  porfolioApi() {
    return this.http.get("https://portfolio-api-m6u1.onrender.com", { responseType: 'text' }); // Specify 'text' for non-JSON
  }
  chatAppApi() {
    return this.http.get("https://chat-app-node-socket-io-5m2o.onrender.com", { responseType: 'text' }); // Specify 'text' for non-JSON
  }
  
}
