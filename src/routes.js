/* routes.js
* File for setting up url paths for the app. This handles urls users type in to the address bar, not the server.js file
*/

import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';

import App from './App';
import Login from './login/Login';
import Changelog from './changelog/changelog'

const Routes = (props) => (
	<BrowserRouter {...props}>
        <div>
            <Switch>
                <Route path="/login" component={Login} />
                <Route path="/changelog" component={Changelog} />
                <Route path="/" component={App} />
                <Redirect from="*" to="/" />
            </Switch>
            
        </div>
    </BrowserRouter>
);

export default Routes;