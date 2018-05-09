/* Login.js
* A page for logging in and creating an account for the application
*/

import React from 'react';

import './Login.css'

class Login extends React.Component{

	constructor(){
        super();

        // State contains the current error popup, and a boolean to
        // see if the user is either logging in or creating a new account
        this.state = {
            errorVisible: false,
            errorText: ''
            /*
			signingUp: false,
			loginError: {
				visible: false,
				text: ''
			}
            */
        }

        this.signingUp = false;
	}

    // Attempt to log the user in
    login() {
        // Get the username and password the user input
		var usernameAttempt = this.usernameInput.value;
		var passwordAttempt = this.passwordInput.value;

        // Make sure the user did not leave either field empty
		if(!usernameAttempt){
			var loginError = {
				errorVisible: true,
				errorText: "Please enter a username"
			}
			this.updateLoginError(loginError);
			return;
		}
        else if (!passwordAttempt) {
		    var loginError = {
		        errorVisible: true,
			    errorText: "Please enter a password"
		    }
			this.updateLoginError(loginError);
			return;
		}
		else{
            // If both fields are valid, send a login attempt to the server
            fetch('/login', {
                method: 'POST',
                credentials: 'same-origin',
                body: JSON.stringify({
                    username: usernameAttempt,
                    password: passwordAttempt,
                    stayLoggedIn: this.checkbox.checked
                })
            }).then((res) => {
                // If successful, continue with body of response as a JSON
                if (res.status == 200) {
                    return res.json();
                }
                // Handle an error
                else {
                    console.error("Could not connect to server.\n" + res.statusText);
                    var loginError = {
                        errorVisible: true,
                        errorText: "Could not connect to server.\n" + res.statusText
                    }
                    this.updateLoginError(loginError);
                    return null;
                }
            }).then((result) => {
                // If successful, refresh page which should load main App
                if (result.successful) {
                    window.location.href = "/";
                }
                // If login failed, tell the user
                else {
                    var loginError = {
                        errorVisible: true,
                        errorText: "Incorrect username or password"
                    }
                    this.updateLoginError(loginError);
                }
            });
		}
	}

    // Attempts to create a new user account
    newuser() {
        // Get the fields for username, password, and confirm password
		var usernameAttempt = this.usernameInput.value;
		var passwordAttempt = this.passwordInput.value;
		var confirmPass = this.confirmpasswordInput.value;

        // Ensure none of the fields are blank, notifying user which is blank if one is
		if(!usernameAttempt){
			var loginError = {
				errorVisible: true,
				errorText: "Please enter a username"
			}
			this.updateLoginError(loginError);
			return;
		}
		else if(!passwordAttempt){
			var loginError = {
				errorVisible: true,
				errorText: "Please enter a password"
			}
			this.updateLoginError(loginError);
			return;
		}
		else if(!confirmPass){
			var loginError = {
				errorVisible: true,
				errorText: "Please confirm your password"
			}
			this.updateLoginError(loginError);
			return;
		}
        else {
            // If all inputs filled, check that the passwords match
			if(passwordAttempt != confirmPass){
				var loginError = {
					errorVisible: true,
					errorText: "Passwords do not match."
				}
				this.updateLoginError(loginError);
				return;
			}

            // If all inputs valid, send the username and password to the server to attempt to create a new account
			fetch('/newuser', {
				method: 'POST',
				credentials: 'same-origin',
				body: JSON.stringify({
					username: usernameAttempt,
					password: passwordAttempt
				})
            }).then((res) => {
                // If successfull, continue with http response body as JSON
				if(res.status == 200){
                    try {
                        return res.json();
                    }
                    catch (e) {
                        return null;
                    }
                }
                // Handle http error
				else{
					console.error("Could not connect to server.\n" + res.statusText);
					var loginError = {
						errorVisible: true,
						errorText: "Could not connect to server.\n" + res.statusText
					}
					this.updateLoginError(loginError);
					return null;
				}
            }).then((result) => {
                // See if the username is already taken, and tell user if it was
				if(result.userAlreadyExists){
					var loginError = {
						errorVisible: true,
						errorText: "Username already taken."
					}
					this.updateLoginError(loginError);
                }
                // If successfull, refresh page to login new user
                else {
                    window.location.href = "/";
				}
			})
		}
	}

    // Handle a click on the link that switches between new user and login views
    // INPUT - e - the click event
    // INPUT - signUp - a boolean, true if user is creating a new account, false if they are logging in
    linkClick(e, signUp) {
        // stop event propogation
        e.preventDefault();
        // update screen to match whether the user is logging in or signing up, and reset any errors
		this.setState((prevstate) => {
			return {
				errorVisible: false,
				errorText: ""
			}
        })

        this.signingUp = signUp;
        this.forceUpdate();
	}

    // Change the error text
    // INPUT - newerror - JSON representing the error text and whether it should be displayed.
    updateLoginError(newerror) {
        this.setState(newerror);
	}

    // Allows an enter press to be interpretated and a form submission
    // INPUT - input - login for a login submission, newuser for a new user account submission
	inputKeyPress(input, e){
		if(e.key == 'Enter'){
			if(input === 'login'){
				this.login();
			}
			else if(input === "newuser"){
				this.newuser()
			}
		}
	}

    // Draws the page one of two ways
    // if signingUp == true, draws the new user account screen
    // if signingUp == false, draws the login page
	renderPage(signingUp){
		if(signingUp){
			return(
				<div className="loginPanel">
					<h1 className="loginTitle"> Create a new account </h1>
					<div className="loginError" style={{
						diplay: this.state.errorVisible? 'block': 'none',
					}}>
						{this.state.errorText}
					</div>
					<div className="contentPanel">
						<form>
							<label>Username:</label><br />
							<input className="loginInput" type="text" name="username" 
								ref={(input) => this.usernameInput = input} 
								onKeyPress={(e) => this.inputKeyPress('newuser', e)}/><br />
							<label>Password:</label><br />
							<input className="loginInput" type="password" name="password" 
								ref={(input) => this.passwordInput = input} 
								onKeyPress={(e) => this.inputKeyPress('newuser', e)}/><br />
							<label>Confirm password:</label><br />
							<input className="loginInput" type="password" name="confirmpassword" ref={(input) => this.confirmpasswordInput = input} /><br />
							<button className="loginButton" type="button" onClick={(e) => this.newuser()}>Create account</button>
						</form>
						<br />
						<span className="bottomSpan"> Already have an account? <a className="bottomLink" href="" onClick={(e) => this.linkClick(e, false)}>Log in!</a></span>
					</div>
				</div>
			)
		}
		else{
			return (
				<div className="loginPanel">
					<h1 className="loginTitle"> Log in </h1>
					<div className="loginError" style={{
						diplay: this.state.errorVisible? 'block': 'none',
					}}>
						{this.state.errorText}
					</div>
					<div className="contentPanel">
						<form>
							<label>Username:</label><br />
							<input className="loginInput" type="text" name="username" 
								ref={(input) => this.usernameInput = input}
								onKeyPress={(e) => this.inputKeyPress('login', e)} /><br />
							<label>Password:</label><br />
							<input className="loginInput" type="password" name="password" 
								ref={(input) => this.passwordInput = input} 
								onKeyPress={(e) => this.inputKeyPress('login', e)}/><br />
							<input className="checkbox" type="checkbox" ref={(input) => this.checkbox = input} />Stay logged in
							<br />
							<button className="loginButton" type="button" onClick={(e) => this.login()}>Log in</button>
						</form>
						<br />
						
						<span className="bottomSpan">New to ENotes?<br />
						<a className="bottomLink" href='' onClick={(e) => this.linkClick(e, true)}> Create a new account!</a></span>
					</div>
				</div>
			)
		}
	}

    // Renders the login page
	render(){
		return (
			<div>
				<h1 className="title">Welcome to ENotes!</h1>
				<div className="loginScreen">
						{this.renderPage(this.signingUp)}
				</div>
			</div>
		)
	}
}

export default Login;