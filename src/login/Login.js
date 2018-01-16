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

	login(){
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

            fetch('/login', {
                method: 'POST',
                credentials: 'same-origin',
                body: JSON.stringify({
                    username: usernameAttempt,
                    password: passwordAttempt,
                    stayLoggedIn: this.checkbox.checked
                })
            }).then((res) => {
                if (res.status == 200) {
                    return res.json();
                }
                else {
                    console.error("Could not connect to server.\n" + res.statusText);
                    var loginError = {
                        visible: true,
                        text: "Could not connect to server.\n" + res.statusText
                    }
                    this.updateLoginError(loginError);
                    return null;
                }
            }).then((result) => {
                if (result.successful) {
                    window.location.href = "/";
                }
                else {
                    var loginError = {
                        visible: true,
                        text: "Incorrect username or password"
                    }
                    this.updateLoginError(loginError);
                }
            });
		}
	}

	newuser(){
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
			if(passwordAttempt != confirmPass){
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
                    try {
                        return res.json();
                    }
                    catch (e) {
                        return null;
                    }
				}
				else{
					console.error("Could not connect to server.\n" + res.statusText);
					var loginError = {
						visible: true,
						text: "Could not connect to server.\n" + res.statusText
					}
					this.updateLoginError(loginError);
					return null;
				}
			}).then((result) => {
				if(result.userAlreadyExists){
					var loginError = {
						visible: true,
						text: "Username already taken."
					}
					this.updateLoginError(loginError);
				}
                else {
                    window.location.href = "/";
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
						diplay: this.state.loginError.visible? 'block': 'none',
					}}>
						{this.state.loginError.text}
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