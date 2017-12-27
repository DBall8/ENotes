import React from 'react';

import './rightClickMenu.css';

class RightClickMenu extends React.Component{

	constructor(){
		super();
		this.display = 'none';
	}

	render(){
		return(
			<div className="menu" style={{
				display: this.props.obj.display,
				left: this.props.obj.x,
				top: this.props.obj.y
			}}
			onContextMenu={(e) => e.preventDefault()}>
				<h3 className="menuitem">Color</h3>
				<h3 className="menuitem">Font size</h3>
			</div>
		)
	}
}

export default RightClickMenu;