import { Component, OnInit } from '@angular/core';
import { RestService } from '@app/core/services';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['../auth.component.css']
})
export class ForgotComponent implements OnInit {

  email: string = null;
  errorMessage: string = null;
  message: string = null;

  constructor(private restService: RestService) { }

  ngOnInit() {
  }

  submit() {
    this.message = null;
    this.errorMessage = null;

    this.restService.doForgotPassword(this.email)
      .subscribe(
        result => {
          if (result) {
            this.message = "Further instructions were sent to the provided email address.";
          } else {
            this.errorMessage = "Specified user does not exist, please try again.";
          }
        }
      );
  }
}
