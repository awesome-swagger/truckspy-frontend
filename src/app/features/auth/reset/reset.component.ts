import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { RestService } from '@app/core/services';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['../auth.component.css']
})
export class ResetComponent implements OnInit {

  email: string;
  key: string;
  password: string;
  confirmPassword: string;

  errorMessage: string = null;
  success: boolean = false;

  constructor(
    private restService: RestService,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.email = params.get("email");
      this.key = params.get("key");
      this.validateQueryParams();
    });
  }

  validateQueryParams(): boolean {
    if (!this.email || !this.key) {
      this.errorMessage = "Looks like reset password link is invalid, email and key query params are mandatory.";
      return false;
    }
    return true;
  }

  submit() {
    this.success = false;
    this.errorMessage = null;

    let validParams = this.validateQueryParams();
    if (!validParams) {
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = "New Password and Confirm Password should be equal.";
      return;
    }

    this.restService.doResetPassword(this.email, this.password, this.key)
      .subscribe(
        result => {
          if (result) {
            this.success = true;
          } else {
            this.errorMessage = "Something wrong happened.";
          }
        }
      );
  }
}
