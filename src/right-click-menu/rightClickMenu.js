import React from 'react';

import './rightClickMenu.css';
import ColorChart from '../resources/colorChart';

class RightClickMenu extends React.Component{


	constructor(){
		super();

		this.hide = this.hide.bind(this);
		this.show = this.show.bind(this);

		this.state = {
			note: '',
			display: 'none',
			x: 0,
			y: 0,
			selectedOption: null
		}
	}

	hide(){
		this.setState({
			note: '',
			display: 'none',
			x: 0,
			y: 0,
			selectedOption: null
		})
	}

	show(tag, x, y){
		this.setState({
			note: tag,
			display: 'block',
			x: x,
			y: y,
			selectedOption: null
		});
	}

	optionSelected(e, option){
		e.stopPropagation();
		this.setState((prevstate) => {
			return {
				note: prevstate.note,
				display: 'block',
				x: prevstate.x,
				y: prevstate.y,
				selectedOption: option
			}
		})
	}

	selectColor(color){
		var newColor = ColorChart[color];
		this.props.updateNoteColor(this.state.note, newColor);
	}

	drawSubMenu(menu){
		switch(menu){
			case 'colors':
				return (
					<div className="subMenu">
						<div className="menuitem">
							<div className="colorOption" style={{background: ColorChart.red.body}} onClick={(e) => this.selectColor('red')}></div>
						</div>
						<div className="menuitem">
							<div className="colorOption" style={{background: ColorChart.yellow.body}} onClick={(e) => this.selectColor('yellow')}></div>
						</div>
						<div className="menuitem">
							<div className="colorOption" style={{background: ColorChart.orange.body}} onClick={(e) => this.selectColor('orange')}></div>
						</div>
						<div className="menuitem">
							<div className="colorOption" style={{background: ColorChart.green.body}} onClick={(e) => this.selectColor('green')}></div>
						</div>
						<div className="menuitem">
							<div className="colorOption" style={{background: ColorChart.blue.body}} onClick={(e) => this.selectColor('blue')}></div>
						</div>
						<div className="menuitem">
							<div className="colorOption" style={{background: ColorChart.purple.body}} onClick={(e) => this.selectColor('purple')}></div>
						</div>
					</div>
				)
			default:
				return;
		}
	}

	render(){
		return(
			<div className="menu" style={{
					display: this.state.display,
					left: this.state.x,
					top: this.state.y
				}}
				onContextMenu={(e) => e.preventDefault()}>
				<div className="optionsHolder">
					<h3 className="menuitem" onClick={(e) => this.optionSelected(e, "colors")}>Color</h3>
					<h3 className="menuitem">Font size</h3>
				</div>
				{this.drawSubMenu(this.state.selectedOption)}
			</div>
		)
	}
}

export default RightClickMenu;