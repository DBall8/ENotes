import React, { Component } from 'react';
import Note from './note';
import note from './note-class';
import './App.css';

class App extends Component {

  constructor(){
    super();

    // bind functions for each Note component
    this.addNote = this.addNote.bind(this);
    this.deleteNote = this.deleteNote.bind(this);
    this.updateNote = this.updateNote.bind(this);
    this.selectNote = this.selectNote.bind(this);
    this.dragStart = this.dragStart.bind(this);
    this.markUnsaved = this.markUnsaved.bind(this);

    // watch the state of each note
    this.state = {
      notes: {},
      unsaved: false
    }

    // object to hold info about the dragging note
    this.drag = {};

  }

  componentWillMount(){

    window.addEventListener('mouseup', (event) => this.dragEnd(event)); // listen for drag ends
    window.addEventListener('mousemove', (event) => this.dragDuring(event)); // listen for drag movements

    

    // load notes from DB
    this.getNotes();
  }

  componentDidMount(){
    window.setInterval(() => {
      console.log("UNSAVED? " + this.state.unsaved);
      if(this.state.unsaved){
        this.setState((prevstate) => {
          return {
            notes: prevstate.notes,
            unsaved: false
          }
        })
        var notes = {...this.state.notes}
        Object.keys(this.state.notes).map((t) =>{
          if(!notes[t].saved){
            this.updateNote(t);
          }    
        })

      }
      
    }, 1000)
  }

  // ask server for notes
  getNotes(){

    // fetch from /api
    fetch("/api")
    .then((res) => {return res.json()}) // turn result to json (??)
        .then((data) => {
            this.loadNotes(data); // load note
            // if no notes were loaded, create a new one
            if (Object.keys(this.state.notes).length <= 0) {
                this.addNote(100, 100);
            }
        });
  }

  // load notes from an array of objects
  loadNotes(data){

    // start building new notes object for the state
    var notes = {}

    // add a new note class for each object
    data.map((anote) => {
      // build note class
      var n = new note(anote.content, anote.x, anote.y, anote.width, anote.height);
      n.zindex = anote.zindex;
      // insert to notes
      notes[anote.tag] = n;
      
    })
    
    // use notes as state
    this.setState((prevstate) => {
      return {
        notes: notes,
        unsaved: prevstate.unsaved
      }
    })
  }

  // Adds a new note
  addNote(x, y) {
    // build empty note
    var n = new note('', x, y, 300, 200);
    n.selected = true; //start selected
    n.zindex = 9999; // start on top

    // unselect all other notes
    var notes = {...this.state.notes}
    Object.keys(notes).map((k) => {
      notes[k].selected = false;
      if(notes[k].zindex > 0){
          notes[k].zindex--;
      }
    })

    // add to state with time since epoch as a tag
    var t = `note-${Date.now()}`
    notes[t] = n;
    this.setState((prevstate) => {
      return {
        notes: notes,
        unsaved: prevstate.unsaved
      }
    })

    // update DB
    fetch("/api", {
        method: "POST",
        body: JSON.stringify({
            tag: t,
            content: n.content,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            zindex: n.zindex
        })
    }).then((result) => {
      if(result.status != 200){
        console.log("ERROR: Server response: " + result.status)
        console.log(result.statusText);
      }
      return;
    });
    
  }

  // delete a note
  deleteNote(tag){
    var notes = {...this.state.notes}
    notes[tag] = null;
    delete(notes[tag]);
    this.setState((prevstate) => {
      return {
        notes: notes,
        unsaved: prevstate.unsaved
      }
    })

    // update DB
    fetch("/api?tag=" + tag, {
        method: "DELETE",
    }).then((result) => {
      if(result.status != 200){
        console.log("ERROR: Server response: " + result.status)
        console.log(result.statusText);
      }
    });
  }

  updateNote(tag) {
    var notes = { ...this.state.notes };
    var note = notes[tag];

    console.log("UPDATING")
    console.log(this.state.unsaved)

    // update DB
      
    fetch("/api", {
        method: "PUT",
        body: JSON.stringify({
          tag: tag,
          newcontent: note.content,
          newx: note.x,
          newy: note.y,
          newW: note.width,
          newH: note.height,
          newZ: note.zindex
        })
    }).then((result) => {
      if(result.status != 200){
        console.log("ERROR: Server response: " + result.status)
        console.log(result.statusText);
      }
      else{
        note.saved = true;
      }
    });
  }

  // Select a note
  selectNote(tag){
    // if already selected, done
    if(this.state.notes[tag].selected){
      return;
    }

    // go through each note, deselecting it and moving it back 1
    // or if it is the note to select, select it and bring it to front
    var notes = {...this.state.notes};
    Object.keys(notes).map((k) => {
      if(k === tag){
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
    // update state
    this.setState((prevstate) => {
      return {
        notes: notes,
        unsaved: prevstate.unsaved
      }
    })
  }

  // start dragging a note
  dragStart(tag, x, y){
    // save the offset from the corner of the note, so when dragging the note will move with the cursor
    var note = this.state.notes[tag];
    this.drag = { tag: tag, offsetX: x - note.x, offsetY: y - note.y}
  }


  // Move a note to the cursor when the cursor is moved and a note is being dragged
  dragDuring(e){
    // quit now if nothing is being dragged
    if(!this.drag.tag){
      return;
    }
    // grab the note
    const notes = {...this.state.notes}
    var note = notes[this.drag.tag];

    // move note to the cursor minue the offset
    note.x = e.screenX - this.drag.offsetX;
    note.y = e.screenY - this.drag.offsetY;
    // update state
    this.setState((prevstate) => {
      return {
        notes: notes,
        unsaved: prevstate.unsaved
      }
    })
  }

  // stops a dragging note
  dragEnd(e){
    if(!this.drag.tag){
      return;
    }

    this.updateNote(this.drag.tag)
    this.drag = {};
  }

  markUnsaved(){
    this.setState((prevstate) =>{
      return {
        notes: prevstate.notes,
        unsaved: true
      }
    })
  }

  // draws the App
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
            updateNote={this.updateNote}
            selectNote={this.selectNote}
            dragStart={this.dragStart}
            markUnsaved={this.markUnsaved}
          />  
        )

        }
      </div>
    );
  }
}

export default App;
