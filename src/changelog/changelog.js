/* changelog.js
* A simple class for displaying a page listing the changes made to the application
*/

import React from 'react';
import Log from './log';
import "./changelog.css";

class Changelog extends React.Component{

    // Simple display a list of changes, gotten from the log.js file
	render(){
		return(
            <div>
                <button className="backbutton" onClick={(e) => window.location.href = "/"}>Back</button>
				{Log.map((l) =>
					<div className="logdiv">
						<h1>{l.title + ' - ' + l.date}</h1>
						<p>{l.content}</p>
					</div>
				)}
			</div>
		)
	}
}

export default Changelog;