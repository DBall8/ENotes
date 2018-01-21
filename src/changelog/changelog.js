import React from 'react';
import Log from './log';
import "./changelog.css";

class Changelog extends React.Component{

	render(){
		return(
			<div>
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