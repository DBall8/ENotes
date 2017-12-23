import React from 'react';

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

	select(e){
		this.props.selectNote(this.props.tag);
	}

	dragStart(e){
		e.preventDefault();
		this.props.dragStart(this.props.tag, e.screenX, e.screenY);
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
				top: this.props.note.y
				}}
				onMouseDown={(e) => this.select(e)}>
				<div className={"noteHead " + (this.props.note.selected? 'orange': 'yellow')} 
					onMouseDown={(e) => this.dragStart(e)} 
				>
					<button className="newButton" onClick={(e) => this.addNote(e)}>+</button>
					<button className="deleteButton" onClick={(e) => this.deleteNote(e)}>x</button>
				</div>
				<div className="noteBody">
					<textarea className="noteContent" defaultValue={this.props.note.content} />
				</div>
			</div>
		);
	}
}

export default Note;