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

    this.getNotes();

    if(Object.keys(this.state.notes).length <= 0){
      this.addNote(100, 100);
    }

  }

  getNotes(){
    fetch("/api?key=a6f7a67sf")
    .then((res) => {return res.json()})
    .then((data) => this.loadNotes(data));
  }

  loadNotes(data){

    var notes = {}
    var date, lastDate;

    data.map((anote) => {

      var n = new note(anote.content, anote.x, anote.y, anote.width, anote.height);
      n.zindex = anote.zindex;

      date = Date.now();
      
      if(date == lastDate){
        date++;
      }
      lastDate = date;

      notes[`note-${date}`] = n;
      
    })
    this.setState({ notes })
  }

  anotherLoad(notes){
    this.setState
  }

  addNote(x, y){
    var n = new note('', x, y, 300, 200);
    n.selected = true;
    n.zindex = 9999;
    var notes = {...this.state.notes}
    Object.keys(notes).map((k) => {
      notes[k].selected = false;
      if(notes[k].zindex > 0){
          notes[k].zindex--;
      }
    })
    notes[`note-${Date.now()}`] = n;
    this.setState({ notes });
    
  }

  deleteNote(key){
    var notes = {...this.state.notes}
    notes[key] = null;
    delete(notes[key]);
    this.setState({ notes });
  }

  selectNote(key){
    if(this.state.notes[key].selected){
      return;
    }
    var notes = {...this.state.notes};
    Object.keys(notes).map((k) => {
      if(k === key){
        notes[k].selected = true;
        notes[k].zindex = 9999;
      }
      else{
        notes[k].selected = false;
        if(notes[k].zindex > 0){
          notes[k].zindex--;
        }
        
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
