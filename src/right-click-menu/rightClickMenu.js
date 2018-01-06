import React from 'react';

import './rightClickMenu.css';

class RightClickMenu extends React.Component{

	constructor(){
		super();
		this.state = {
			selectedOption: null
		}
		this.display = 'none';
	}

	drawSubMenu(menu){
		if(menu == null){
			return;
		}
		return (
			<div className="subMenu">
				{menu}
			</div>
		)
	}

	render(){
		return(
			<div className="menu" style={{
				display: this.props.obj.display,
				left: this.props.obj.x,
				top: this.props.obj.y
			}}
			onContextMenu={(e) => e.preventDefault()}>
				<h3 className="menuitem" onClick={(e) => this.setState({ selectedOption: "l"})}>Color</h3>
				<h3 className="menuitem">Font size</h3>
				{this.drawSubMenu(this.state.selectedOption)}
			</div>
			
		)
	}
}

export default RightClickMenu;