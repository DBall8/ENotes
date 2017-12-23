import React, { Component } from 'react';
import Note from './note';
import note from './note-class';
import './App.css';

class App extends Component {

  constructor(){
    super();

    this.addNote = this.addNote.bind(this);
    this.deleteNote = this.deleteNote.bind(this);
    this.selectNote = this.selectNote.bind(this);
    this.dragStart = this.dragStart.bind(this);

    this.state = {
      notes: {}
    }

    this.drag = {};

  }

  componentWillMount(){

    window.addEventListener('mouseup', (event) => this.dragEnd(event));
    window.addEventListener('mousemove', (event) => this.dragDuring(event));

    if(Object.keys(this.state.notes).length <= 0){
      this.addNote(100, 100);
    }
  }

  addNote(x, y){
    var n = new note('', '', x, y, 300, 200);
    n.selected = true;
    var notes = {...this.state.notes}
    Object.keys(notes).map((k) => {
      notes[k].selected = false;
    })
    var key = `note-${Date.now()}`;
    notes[key] = n;
    this.setState({ notes });
    
  }

  deleteNote(key){
    var notes = {...this.state.notes}
    notes[key] = null;
    delete(notes[key]);
    this.setState({ notes });
  }

  selectNote(key){
    var notes = {...this.state.notes};
    Object.keys(notes).map((k) => {
      if(k === key){
        notes[k].selected = true;
      }
      else{
        notes[k].selected = false;
      }
    })
    this.setState({notes})
  }

  dragStart(key, x, y){
    var note = this.state.notes[key];
    this.drag = { key: key, startx: x - note.x, starty: y - note.y}
  }

  dragDuring(e){
    if(!this.drag.key){
      return;
    }
    const notes = {...this.state.notes}
    var note = notes[this.drag.key];
    note.x = e.screenX - this.drag.startx;
    note.y = e.screenY - this.drag.starty;
    this.setState({ notes });
  }

  dragEnd(e){
    if(!this.drag.key){
      return;
    }

    this.drag = {};
  }

  render() {
    return (
      <div className="App" >
        <h1>Welcome to ENotes!</h1>
        { Object.keys(this.state.notes).map((key) =>
          <Note
            key={key}
            tag={key}
            note={this.state.notes[key]}
            addNote={this.addNote}
            deleteNote={this.deleteNote}
            selectNote={this.selectNote}
            dragStart={this.dragStart}
          />  
        )

        }
      </div>
    );
  }
}

export default App;
