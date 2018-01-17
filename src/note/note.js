import React from 'react';

import resizeIm from '../resources/resize.png'
import plusIm from '../resources/plus.png'
import delIm from '../resources/x.png'
import './note.css';

class Note extends React.Component{

	addNote(e){
		e.stopPropagation();
		var n = this.props.note;
		this.props.addNote(n.x + 100, n.y + 100);
	}

	deleteNote(e){
		e.stopPropagation();
		this.props.deleteNote(this.props.tag);
	}

	updateNote(e){
		this.props.note.content = this.contentArea.value;
		this.props.updateNote(this.props.tag, this.contentArea.value)
	}

	select(e){
		this.props.selectNote(this.props.tag);
	}

	dragStart(e){
		e.preventDefault();
		this.props.dragStart(this.props.tag, e.screenX, e.screenY);
    }

    startResize(e) {
        e.preventDefault();
        this.props.resizeStart(this.props.tag, e.screenX, e.screenY);
    }

	inputEvent(e){
		this.props.note.content = this.contentArea.value;
		this.props.note.saved = false;
		this.props.markUnsaved();
	}

	keyInput(e){
		
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

	rightClick(e){
	    var rightClick = false;
	    if("which" in e){
	        //console.log("WHICH: " + e.which);
	        rightClick = e.which == 3;
	    }
	    if("button" in e){
	        //console.log("BUTTON: " + e.button);
	        rightClick = e.button == 2;
	    }

		if(rightClick){
		    e.stopPropagation();
			this.props.launchOptions(this.props.tag, e.clientX, e.clientY);
		}
	}

	getBodyColor(colors){
	    if(colors && colors.body){
	        return colors.body;
	    }
	    return '#ffe062';
	}

	getHeadColor(colors){
    	    if(colors && colors.head){
    	        return colors.head;
    	    }
    	    return '#ddaf00';
    	}

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
						defaultValue={this.props.note.content}
						onBlur={(e) => this.updateNote(e)} 
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