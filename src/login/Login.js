import React from 'react';

import './Login.css'

class Login extends React.Component{

	constructor(){
		super();
		this.state = {
			signingUp: false,
			loginError: {
				visible: false,
				text: ''
			}
		}

		this.usernameTaken = false;
		this.passwordsDontMatch = false;
	}

	login(e){
		var usernameAttempt = this.usernameInput.value;
		var passwordAttempt = this.passwordInput.value;

		if(!usernameAttempt){
			var loginError = {
				visible: true,
				text: "Please enter a username"
			}
			this.updateLoginError(loginError);
			return;
		}
		else if(!passwordAttempt){
			var loginError = {
				visible: true,
				text: "Please enter a password"
			}
			this.updateLoginError(loginError);
			return;
		}
		else{
			console.log("User: " + usernameAttempt);
			console.log("Password: " + passwordAttempt)

			fetch('/login', {
				method: 'POST',
				credentials: 'same-origin',
				body: JSON.stringify({
					username: usernameAttempt,
					password: passwordAttempt,
					stayLoggedIn: this.checkbox.checked
				})
			}).then((res) => {
				if(res.status == 200){
					return res.json();
				}
				else{
					console.log("Could not connect to server.\n" + res.statusText);
					var loginError = {
						visible: true,
						text: "Could not connect to server.\n" + res.statusText
					}
					this.updateLoginError(loginError);
					return null;
				}
			}).then((result) => {
				if(result.successful){
					console.log("SUCCESS, sessionID = " + result.sessionID);
					this.props.receiveLogin(usernameAttempt, result.sessionID, this.checkbox.checked);
				}
				else{
					console.log("LOGIN FAILED");
					var loginError = {
						visible: true,
						text: "Incorrect username or password"
					}
					this.updateLoginError(loginError);
				}
			})
		}
	}

	newuser(e){
		var usernameAttempt = this.usernameInput.value;
		var passwordAttempt = this.passwordInput.value;
		var confirmPass = this.confirmpasswordInput.value;

		if(!usernameAttempt){
			var loginError = {
				visible: true,
				text: "Please enter a username"
			}
			this.updateLoginError(loginError);
			return;
		}
		else if(!passwordAttempt){
			var loginError = {
				visible: true,
				text: "Please enter a password"
			}
			this.updateLoginError(loginError);
			return;
		}
		else if(!confirmPass){
			var loginError = {
				visible: true,
				text: "Please confirm your password"
			}
			this.updateLoginError(loginError);
			return;
		}
		else{
			console.log("User: " + usernameAttempt);
			console.log("Password: " + passwordAttempt)

			if(passwordAttempt != confirmPass){
				console.log("Passwords do not match");
				var loginError = {
					visible: true,
					text: "Passwords do not match."
				}
				this.updateLoginError(loginError);
				return;
			}

			fetch('/newuser', {
				method: 'POST',
				credentials: 'same-origin',
				body: JSON.stringify({
					username: usernameAttempt,
					password: passwordAttempt
				})
			}).then((res) => {
				if(res.status == 200){
					return res.json();
				}
				else{
					console.log("Could not connect to server.\n" + res.statusText);
					var loginError = {
						visible: true,
						text: "Could not connect to server.\n" + res.statusText
					}
					this.updateLoginError(loginError);
					return null;
				}
			}).then((result) => {
				if(result.userAlreadyExists){
					console.log("USERNAME TAKEN");
					var loginError = {
						visible: true,
						text: "Username already taken."
					}
					this.updateLoginError(loginError);
				}
				else{
					this.props.receiveLogin(usernameAttempt, result.sessionID, false);
					console.log("USER ADDED")
				}
			})
		}
	}

	linkClick(e, signUp){
		e.preventDefault();
		this.setState((prevstate) => {
			return {
				signingUp: signUp,
				loginError: {
					visible: false,
					text: ""
				}
			}
		})
	}

	updateLoginError(newerror){
		this.setState((prevstate) => {
			return {
				signingUp: prevstate.signingUp,
				loginError: newerror
			}
		})
	}


	renderPage(signingUp){
		if(signingUp){
			return(
				<div className="loginPanel">
					<h1 className="loginTitle"> Create a new account </h1>
					<div className="loginError" style={{
						diplay: this.state.loginError.visible? 'block': 'none',
					}}>
						{this.state.loginError.text}
					</div>
					<div className="contentPanel">
						<form>
							<label>Username:</label><br />
							<input className="loginInput" type="text" name="username" ref={(input) => this.usernameInput = input} /><br />
							<label>Password:</label><br />
							<input className="loginInput" type="password" name="password" ref={(input) => this.passwordInput = input} /><br />
							<label>Confirm password:</label><br />
							<input className="loginInput" type="password" name="confirmpassword" ref={(input) => this.confirmpasswordInput = input} /><br />
							<button className="loginButton" type="button" onClick={(e) => this.newuser(e)}>Create account</button>
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
						diplay: this.state.loginError.visible? 'block': 'none',
					}}>
						{this.state.loginError.text}
					</div>
					<div className="contentPanel">
						<form>
							<label>Username:</label><br />
							<input className="loginInput" type="text" name="username" ref={(input) => this.usernameInput = input} /><br />
							<label>Password:</label><br />
							<input className="loginInput" type="password" name="password" ref={(input) => this.passwordInput = input} /><br />
							<input className="checkbox" type="checkbox" ref={(input) => this.checkbox = input} />Stay logged in
							<br />
							<button className="loginButton" type="button" onClick={(e) => this.login(e)}>Log in</button>
						</form>
						<br />
						
						<span className="bottomSpan">New to ENotes?<br />
						<a className="bottomLink" href='' onClick={(e) => this.linkClick(e, true)}> Create a new account!</a></span>
					</div>
				</div>
			)
		}
	}

	render(){
		return (
			<div>
				<h1 className="title">Welcome to ENotes!</h1>
				<div className="loginScreen">
						{this.renderPage(this.state.signingUp)}
				</div>
			</div>
		)
	}
}

export default Login;