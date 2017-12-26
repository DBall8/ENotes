import React from 'react';

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
		console.log("INPUT")
	}

	render(){
		if(this.props.note == null){
			return null;
		}
		return(
			<div className="note" style={{
				width: this.props.note.width,
				height: this.props.note.height,
				left: this.props.note.x,
				top: this.props.note.y,
				zIndex: this.props.note.zindex
				}}
            onMouseDown={(e) => this.select(e)}>

				<div className={"noteHead " + (this.props.note.selected? 'orange': 'yellow')} 
					onMouseDown={(e) => this.dragStart(e)} 
				>
					<button className="newButton" onClick={(e) => this.addNote(e)}>+</button>
					<button className="deleteButton" onClick={(e) => this.deleteNote(e)}>x</button>
				</div>
				<div className="noteBody" style={{height: this.props.note.height - 40}}>
                    <textarea className="noteContent" 
                        spellCheck="false"
						ref={(input) => this.contentArea = input}
						defaultValue={this.props.note.content}
						onBlur={(e) => this.updateNote(e)} 
                        onInput={(e) => this.inputEvent(e)} />
                    
                </div>
                <div className="resize" style={{
                    left: this.props.note.width - 18,
                    top: -8
                }}
                    onMouseDown={(e) => this.startResize(e)}>
                </div>
			</div>
		);
	}
}

export default Note;