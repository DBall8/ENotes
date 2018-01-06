import React from 'react';
import Cookie from 'universal-cookie';

import NotePage from './note-page/NotePage';
import Login from './login/Login';


class App extends React.Component{

	constructor(){
		super();

		this.receiveLogin = this.receiveLogin.bind(this);
		this.logout = this.logout.bind(this);

		this.state = {
			username: '',
			sessionID: ''
		}

		this.cookies = null;
	}

	componentWillMount(){
		this.cookies = new Cookie();
		var sID = this.cookies.get('sessionID');
		var user = this.cookies.get('username');

		if(sID && user){
			this.setState({
				username: user,
				sessionID: sID
			})
		}
	}

	componentDidMount(){
		var sID = this.cookies.get('sessionID');
		var user = this.cookies.get('username');
	}

	receiveLogin(username, SID, save){
		this.setState({
			username: username,
			sessionID: SID
		})

		if(save){
			var today = new Date();
			var oneweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7)
			this.cookies.set('username', username, {path: './', expires: oneweek });
			this.cookies.set('sessionID', SID, { path: './', expires: oneweek });
		}
		else{
			this.cookies.set('username', username, {path: './' });
			this.cookies.set('sessionID', SID, { path: './' })
		}
	}

	logout(){
		this.setState({
			username: '',
			sessionID: ''
		})

		this.cookies.remove('username');
		this.cookies.remove('sessionID');
	}

	renderPage(SID){
		if(SID){
			return (<NotePage 
						sessionID={this.state.sessionID}
						username={this.state.username}
						logout={this.logout}
					/>)
		}
		else{
			return (<Login 
						receiveLogin={this.receiveLogin}
					/>)
		}
	}

	render(){
		return(
			<div>{this.renderPage(this.state.sessionID)}</div>
		)
		
	}
}

export default App;