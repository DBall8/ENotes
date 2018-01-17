import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';

import App from './App';
import NotePage from './note-page/NotePage';
import Login from './login/Login';
import Changelog from './changelog/changelog'

const Routes = (props) => (
	<BrowserRouter {...props}>
        <div>
            <Switch>
                <Route path="/login" component={Login} />
                <Route path="/changelog" component={Changelog} />
                <Route path="/" component={NotePage} />
                <Redirect from="*" to="/" />
            </Switch>
            
        </div>
    </BrowserRouter>
);

export default Routes;