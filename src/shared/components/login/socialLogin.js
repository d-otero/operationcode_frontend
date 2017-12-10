import React, { Component } from 'react';
import axios from 'axios';
import config from 'config/environment';
import PropTypes from 'prop-types';
import Section from 'shared/components/section/section';
import Form from 'shared/components/form/form';
import FormZipCode from 'shared/components/form/formZipCode/formZipCode';
import FormPassword from 'shared/components/form/formPassword/formPassword';
import FormButton from 'shared/components/form/formButton/formButton';
import styles from 'scenes/home/informationForm/informationForm.css';
import _ from 'lodash';
import * as CookieHelpers from '../../utils/cookieHelper';

class SocialLogin extends Component {
  state = {
    zip: '',
    zipValid: false,
    password: '',
    passwordValid: false,
    error: false,
    isLoading: false
  };

  componentWillUnmount() {
    this.onExit();
  }

  onZipChange = (value, valid) => {
    this.setState({ zip: value, zipValid: valid });
  };

  onPasswordChange = (value, valid) => {
    this.setState({ password: value, passwordValid: valid });
  };

  onExit = () => {
    window.localStorage.removeItem('firstname');
    window.localStorage.removeItem('lastname');
    window.localStorage.removeItem('email');
  };

  run = (First, Last, Email) => {
    axios
      .post(`${config.backendUrl}/users/exist`, {
        user: {
          email: Email
        }
      })
      .then(({ data }) => {
        window.localStorage.setItem('firstname', `${First}`);
        window.localStorage.setItem('lastname', `${Last}`);
        window.localStorage.setItem('email', `${Email}`);
        if (data.redirect_to === '/social_login') {
          this.props.updateRootAuthState((history) => {
            history.push(data.redirect_to);
          });
        } else {
          this.login();
        }
      })
      .catch((error) => {
        const data = _.get(error, 'response.data');
        let errorMessage = '';
        if (data) {
          Object.keys(data).forEach((key) => {
            if (data && data[key]) {
              errorMessage += ` ${key}: ${data[key][0]} `;
              this.state.error = errorMessage;
            }
          });
        }

        this.props.sendNotification(
          'error',
          'Error',
          'We will investigate this issue!'
        );
      });
  };

  login = (Zip, Password) => {
    axios
      .post(`${config.backendUrl}/users/social`, {
        user: {
          email: localStorage.getItem('email'),
          first_name: localStorage.getItem('firstname'),
          last_name: localStorage.getItem('lastname'),
          zip: Zip,
          password: Password
        }
      })
      .then(({ data }) => {
        localStorage.removeItem('firstname');
        localStorage.removeItem('lastname');
        localStorage.removeItem('email');
        CookieHelpers.setUserAuthCookie(data);
        this.props.updateRootAuthState((history) => {
          this.props.sendNotification(
            'success',
            'Success',
            'You have logged in!'
          );
          history.push(data.redirect_to);
        });
      })
      .catch((error) => {
        const data = _.get(error, 'response.data');
        let errorMessage = '';
        if (data) {
          Object.keys(data).forEach((key) => {
            if (data && data[key]) {
              errorMessage += ` ${key}: ${data[key][0]} `;
              this.state.error = errorMessage;
            }
          });
        }
        this.props.sendNotification(
          'error',
          'Error',
          'We will investigate this issue!'
        );
      });
  };

  handleOnClick = (e) => {
    e.preventDefault();
    this.setState({ isLoading: true });
    if (this.isFormValid()) {
      this.login(this.state.zip, this.state.password);
    } else {
      this.setState({ error: 'Missing required field(s)', isLoading: false });
      this.zipRef.inputRef.revalidate();
      this.passwordRef.inputRef.revalidate();
    }
  };

  isFormValid = () => this.state.zipValid && this.state.passwordValid;

  render() {
    console.log(this.props);
    return (
      <Section className={styles.signup} title="Zipcode and Password Required">
        <Form className={styles.signupForm}>
          <FormZipCode
            id="zip"
            placeholder="Zip Code (Required)"
            onChange={this.onZipChange}
            ref={(child) => {
              this.zipRef = child;
            }}
          />
          <FormPassword
            id="password"
            placeholder="Password (Required)"
            onChange={this.onPasswordChange}
            validationRegex={/^(?=.*[A-Z]).{6,}$/}
            validationErrorMessage="Must be 6 characters long and include a capitalized letter"
            ref={(child) => {
              this.passwordRef = child;
            }}
          />
          {this.state.error && (
            <ul className={styles.errorList}>
              There was an error joining Operation Code:
              <li className={styles.errorMessage}>{this.state.error}</li>
            </ul>
          )}
          {this.state.isLoading ? (
            <FormButton
              className={styles.joinButton}
              text="Loading..."
              disabled
              theme="grey"
            />
          ) : (
            <FormButton
              className={styles.joinButton}
              text="Join"
              onClick={this.handleOnClick}
              theme="red"
            />
          )}
        </Form>
      </Section>
    );
  }
}

SocialLogin.propTypes = {
  sendNotification: PropTypes.func.isRequired,
  updateRootAuthState: PropTypes.func
};

SocialLogin.defaultProps = {
  updateRootAuthState: () => {}
};

export default SocialLogin;
