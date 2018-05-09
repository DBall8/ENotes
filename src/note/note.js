/* note.js
* A class for displaying an individual note
*/

import React from 'react';

import resizeIm from '../resources/resize.png'
import plusIm from '../resources/plus.png'
import delIm from '../resources/x.png'
import './note.css';

class Note extends React.Component{

    constructor() {
        super();

        this.copy = this.copy.bind(this)
        this.paste = this.paste.bind(this)
    }

    // Handles the click on the plus button on the top of the note
	addNote(e){
		e.stopPropagation();
		var n = this.props.note;
		this.props.addNote(n.x + 100, n.y + 100);
	}

    // Handles the click on the x button on the top of the note
	deleteNote(e){
		e.stopPropagation();
		this.props.deleteNote(this.props.tag);
	}

    // Handles any part of the note gaining focus
	select(e){
		this.props.selectNote(this.props.tag);
	}

    // Handles the top bar of the note being dragged, which moves the note
	dragStart(e){
		e.preventDefault();
		this.props.dragStart(this.props.tag, e.screenX, e.screenY);
    }

    // Handles the bottom right corner of the note being dragged, which resizes the note
    startResize(e) {
        e.preventDefault();
        this.props.resizeStart(this.props.tag, e.screenX, e.screenY);
    }

    // handles any key inputs when the note is selected
    inputEvent(e) {
        this.props.updateNoteText(this.props.tag, e.target.value)
	}

    // filters key inputs for special keys
	keyInput(e){
		// Override tab key to insert 4 spaces
		if(e.key === 'Tab'){
			var pos = this.contentArea.selectionStart;
			e.preventDefault();
			var text = this.contentArea.value;
			var length = text.length;
			text = text.substring(0, pos) + '    ' + text.substring(pos, length);
			this.contentArea.value = text;
			this.contentArea.selectionStart = pos + 4;
			this.contentArea.selectionEnd = pos + 4;
		}

    }

    // Saves the selected text in this note when the copy option is selected from the custom right click menu
    copy() {
        var start = this.contentArea.selectionStart;
        var end = this.contentArea.selectionEnd;
        console.log(this.contentArea.value.substring(start, end))
        this.props.saveToMyClipboard(this.contentArea.value.substring(start, end))

    }

    // Writes the saved text to this note when the paste option is selected from the custom right click menu
    paste() {
        var start = this.contentArea.selectionStart;
        var end = this.contentArea.selectionEnd;
        var text = this.contentArea.value;
        var length = text.length;
        text = text.substring(0, start) + this.props.retrieveFromMyClipboard() + text.substring(end, length);
        this.contentArea.value = text;
    }

    // Launches the custom right click menu when the note is right clickeda
	rightClick(e){
        var rightClick = false; // If the right mouse button was pressed

        // Check different browser implementations for if the right mouse button was pressed
	    if("which" in e){
	        //console.log("WHICH: " + e.which);
	        rightClick = e.which == 3;
	    }
	    if("button" in e){
	        //console.log("BUTTON: " + e.button);
	        rightClick = e.button == 2;
	    }

        // If right mouse button was pressed, launch the custom right click menu
		if(rightClick){
		    e.stopPropagation();
			this.props.launchOptions(this.props.tag, e.clientX, e.clientY);
		}
	}

    // Gets the hex code for the body color of this note
    // INPUT - colors - JSON object representing the colors of this note
    // OUTPUT - a string representing the hex code for the body color
	getBodyColor(colors){
	    if(colors && colors.body){
	        return colors.body;
        }
        // return default yellow
	    return '#ffe062';
	}

    // Gets the hex code for the head color of this note
    // INPUT - colors - JSON object representing the colors of this note
    // OUTPUT - a string representing the hex code for the head color
	getHeadColor(colors){
    	if(colors && colors.head){
    	    return colors.head;
        }
        // return default yellow
    	return '#ddaf00';
    }

    // Draw the note
	render(){
		if(this.props.note == null){
			return null;
		}
		return(
			<div className="note" style={{
				background: this.getBodyColor(this.props.note.colors),
				width: this.props.note.width,
				height: this.props.note.height,
				left: this.props.note.x,
				top: this.props.note.y,
				zIndex: this.props.note.zindex
				}}
            onMouseDown={(e) => this.select(e)}
            onMouseUp={(e) => this.rightClick(e)}
            onContextMenu={(e) => e.preventDefault()}>

				<div className="noteHead" 
					style={{
						background: (this.props.note.selected? this.getHeadColor(this.props.note.colors): 'none')
					}}
					onMouseDown={(e) => this.dragStart(e)} 
				>
                    <input type="image" src={plusIm} className={"newButton button"} onClick={(e) => this.addNote(e)} />
                    <input type="image" src={delIm} className={"deleteButton button"} onClick={(e) => {
                    	if(window.confirm("Are you sure you want to delete this note?")){this.deleteNote(e)}
                    }} />
				</div>
				<div className="noteBody" style={{height: this.props.note.height - 40}}>
                    <textarea className="noteContent" 
                        spellCheck="false"
						ref={(input) => this.contentArea = input}
						value={this.props.note.content}
						//onBlur={(e) => this.updateNote(e)} 
                        //onChange={(e) => this.onInput(e)}
                        onInput={(e) => this.inputEvent(e)}
                        onKeyDown={(e) => this.keyInput(e)} />
                    
                </div>
                <img src={resizeIm} alt="Drag to resize" className="resize" style={{
                    left: this.props.note.width - 18,
                    top: -14
                }}
                    onMouseDown={(e) => this.startResize(e)}>
                </img>
			</div>
		);
	}
}

export default Note;