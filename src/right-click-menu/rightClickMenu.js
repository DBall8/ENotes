/* richtClickMenu.js
* Class for displaying a menu like a regular right click menu,
* but with custom options for the application
*/

import React from 'react';

import './rightClickMenu.css';
import ColorChart from '../resources/colorChart';

class RightClickMenu extends React.Component{


	constructor(){
		super();

		this.hide = this.hide.bind(this);
		this.show = this.show.bind(this);

        // (might move some of these out of the state)
        // note: the tag of the note that was right clicked
        // display: the css for displaying the menu
        // x: the x coord of the menu
        // y: the y coord of the menu
        // selectedOption: the sub menu that is currently open (null for none)
		this.state = {
			note: '',
			display: 'none',
			x: 0,
			y: 0,
			selectedOption: null
		}
	}

    // Hide the right click menu
	hide(){
		this.setState({
			note: '',
			display: 'none',
			x: 0,
			y: 0,
			selectedOption: null
		})
	}

    // Show the right click meni
    // INPUT - tag - the tag of the note that was right clicked
    // INPUT - x - the x coordinate of the mouse click
    // INPUT - y - the y coordinate of the mouse click
	show(tag, x, y){
		this.setState({
			note: tag,
			display: 'block',
			x: x,
			y: y,
			selectedOption: null
		});
	}

    // Options a sub menu when an option is selected
    // INPUT - e - the mouse event
    // INPUT - option - a string representing the name of the open submenu
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

    // Selects a color from a submenu and changes the note's color to that color
    // INPUT - color - the string representing the name of the selected color
	selectColor(color){
		var newColor = ColorChart[color];
		this.props.changeNoteColor(this.state.note, newColor);
    }

    // Draws a sub menu
    // INPUT - menu - a string representing which sub menu to draw
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

    // Draws the right click menu
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
                    <h3 className="menuitem" onClick={(e) => this.props.copy()}>Copy</h3>
                    <h3 className="menuitem" onClick={(e) => this.props.paste()}>Paste</h3>
				</div>
				{this.drawSubMenu(this.state.selectedOption)}
			</div>
		)
	}
}

export default RightClickMenu;