import React from 'react';
import Note from '../note/note';
import note from '../note/note-class';
import RightClickMenu from '../right-click-menu/rightClickMenu';
import OptionsMenu from '../options-menu/optionsMenu';
import './NotePage.css';
import ColorChart from '../resources/colorChart';

class NotePage extends React.Component {

  constructor(){
    super();

    // bind functions for each Note component
    this.addNote = this.addNote.bind(this);
    this.deleteNote = this.deleteNote.bind(this);
    this.updateNote = this.updateNote.bind(this);
    this.selectNote = this.selectNote.bind(this);
    this.dragStart = this.dragStart.bind(this);
    this.resizeStart = this.resizeStart.bind(this);
    this.markUnsaved = this.markUnsaved.bind(this);
    this.updateNoteColor = this.updateNoteColor.bind(this);
    this.logout = this.logout.bind(this);

    // watch the state of each note
    this.state = {
      notes: {}
    }

    this.defaultColors = ColorChart.yellow;
    this.unsaved = false;
    this.username = '';

    // object to hold info about the dragging note
    this.drag = {};
    this.resize = {};

  }

  // STATE MANAGEMENT FUNCTIONS
  setNoteState(notes){
    this.setState((prevstate) => {
      return {
        notes: notes
      }
    })
  }

  // LIFE CYCLE FUNCTIONS

  componentWillMount(){

      window.addEventListener('click', (event) => {
        var rightClick = false;
        if("which" in event){
            //console.log("WHICH: " + e.which);
            rightClick = event.which == 3;
        }
        if("button" in event){
            //console.log("BUTTON: " + e.button);
            rightClick = event.button == 2;
        }

        if(!rightClick && this.rightClickMenu && this.rightClickMenu.state.display === 'block'){
          this.rightClickMenu.hide();
        }

        if (!rightClick && this.optionsMenu && this.optionsMenu.state.display === 'block') {
            this.optionsMenu.toggleDisplay();
        }
        
      })
      window.addEventListener('mouseup', (event) => {
          this.dragEnd(event)
          this.resizeEnd(event)

      }); // listen for drag ends
      window.addEventListener('mousemove', (event) => {
          this.dragDuring(event)
          this.resizeDuring(event)
      }); // listen for drag movements

    

    // load notes from DB
    this.getNotes();
  }

  componentDidMount(){
    window.setInterval(() => {
      if(this.unsaved){
        this.unsaved = false;
        var notes = {...this.state.notes}
        Object.keys(this.state.notes).map((t) =>{
          if(!notes[t].saved){
            this.updateNote(t);
          }
          return;
        })

      }
      
    }, 1000)
  }

  // DATA MANAGEMENT FUNCTIONS

  // ask server for notes
  getNotes(){
    // fetch from /api
      //* FETCH
      fetch("/api", {
          method: "GET",
          credentials: 'same-origin'
      })
    .then((res) => {
        if (res.status !== 200) {
            console.error(res);
            return null;
        }
        else if (res.redirected) {
            window.location.href = '/login';
        }
        else{ return res.json()}
      }) 
          .then((data) => {
            if(data.sessionExpired){
              window.location.href = "/login";
            }
            this.username = data.username;
            this.loadNotes(data.notes); // load note
            // if no notes were loaded, create a new one
            if (Object.keys(this.state.notes).length <= 0) {
                this.addNote(100, 100);
            }
          
        });
      //FETCH */

      /* FETCH REMOVE
      if (Object.keys(this.state.notes).length <= 0) {
          this.addNote(300, 300);
      }
      */
  }

  // load notes from an array of objects
  loadNotes(data){

    // start building new notes object for the state
    var notes = {}

    // add a new note class for each object
    data.map((anote) => {
      // build note class
      var colors;
      try{
        colors = JSON.parse(anote.colors);
      }
      catch(e){
        console.error("Failed to parse colors json");
        console.error(e);
        console.error(anote.colors);
        colors = {};
      }

      var n = new note(anote.content, anote.x, anote.y, anote.width, anote.height, colors);
      n.zindex = anote.zindex;
      // insert to notes
      notes[anote.tag] = n;
      return;
    })
    
    // use notes as state
    this.setNoteState(notes);
  }

  // Adds a new note
  addNote(x, y) {
    // build empty note
    var n = new note('', x, y, 300, 200, JSON.stringify(this.defaultColors));
    n.selected = true; //start selected
    n.zindex = 9999; // start on top

    // unselect all other notes
    var notes = {...this.state.notes}
    Object.keys(notes).map((k) => {
      notes[k].selected = false;
      if(notes[k].zindex > 0){
          notes[k].zindex--;
      }
      return;
    })

    // add to state with time since epoch as a tag
    var t = `note-${Date.now()}`
    notes[t] = n;
    this.setNoteState(notes);

      //* FETCH
    // update DB
    fetch("/api", {
        method: "POST",
        credentials: 'same-origin',
        body: JSON.stringify({
            tag: t,
            content: n.content,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            zindex: n.zindex,
            colors: n.colors
        })
    }).then((result) => {
      if(result.status !== 200){
        console.error("ERROR: Server response: " + result.status)
        console.error(result.statusText);
      }
      else if (result.redirected) {
        window.location.href = '/login';
      }
      else{
        return result.json();

      }
      return;
    }).then((res) =>{
      if(res.sessionExpired){
        window.location.href = '/login';
      }

    });

    //FETCH */
    
  }

  // delete a note
  deleteNote(tag){
    var notes = {...this.state.notes}
    notes[tag] = null;
    delete(notes[tag]);
    this.setNoteState(notes);

    // update DB
      //* FETCH
    fetch("/api", {
        method: "DELETE",
        credentials: 'same-origin',
        body: JSON.stringify({
          tag: tag
        })
    }).then((result) => {
      if(result.status !== 200){
        console.error("ERROR: Server response: " + result.status)
        console.error(result.statusText);
      }
      else if (result.redirected) {
        window.location.href = '/login';
      }
      else{
        return result.json();
      }
    }).then((res) =>{
      if(res.sessionExpired){
        window.location.href = '/login';
      }
    });
    //FETCH */
  }

  updateNote(tag) {
    var notes = { ...this.state.notes };
    var note = notes[tag];

    // update DB
      //* FETCH
    fetch("/api", {
        method: "PUT",
        credentials: 'same-origin',
        body: JSON.stringify({
          tag: tag,
          newcontent: note.content,
          newx: note.x,
          newy: note.y,
          newW: note.width,
          newH: note.height,
          newZ: note.zindex,
          newColors: JSON.stringify(note.colors)
        })
    }).then((result) => {
      if(result.status !== 200){
        console.error("ERROR: Server response: " + result.status)
        console.error(result.statusText);
      }
      else if (result.redirected) {
        window.location.href = '/login';
      }
      else{
        return result.json();
  
      }
    }).then((res) =>{
      if(res.sessionExpired){
        window.location.href = '/login';
      }
      note.saved = true;
    });
     // FETCH */
  }

  updateNoteColor(tag, newcolor){
    var notes = {...this.state.notes};
    notes[tag].colors = newcolor;
    this.setState({notes: notes}, () => {
      this.updateNote(tag)
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
      return;
    })
    // update state
    this.setNoteState(notes);
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
    this.setNoteState(notes);
  }

  // stops a dragging note
  dragEnd(e){
    if(!this.drag.tag){
      return;
    }

    this.updateNote(this.drag.tag)
    this.drag = {};
  }

  resizeStart(tag, x, y) {
      // save the offset from the corner of the note, so when dragging the note will move with the cursor
      this.resize = { tag: tag, startX: x, startY: y }
  }

  resizeDuring(e) {
    // quit now if nothing is being dragged
    if (!this.resize.tag) {
        return;
    }
    // grab the note
    const notes = { ...this.state.notes }
    var note = notes[this.resize.tag];

    // move note to the cursor minue the offset
    note.width += e.screenX - this.resize.startX;
    this.resize.startX = e.screenX;
    note.height += e.screenY - this.resize.startY;
    this.resize.startY = e.screenY;
    // update state
    this.setNoteState(notes);
  }

  resizeEnd(e) {
    if (!this.resize.tag) {
        return;
    }

    this.updateNote(this.resize.tag)
    this.resize = {};
  }

  markUnsaved(){
    this.unsaved = true;
  }

  logout(){

    fetch("/logout", {
        method: "POST",
        credentials: 'same-origin'
    }).then((result) => {
      if(result.status !== 200){
        console.error("ERROR: Server response: " + result.status)
        console.error(result.statusText);
        }
      else {
          window.location.href = "/login";
      }
    });
  }

  toggleOptions(e) {
      e.stopPropagation()
      this.optionsMenu.toggleDisplay();
  }

  refresh() {
      this.setState({
          notes: {}
      });

      this.getNotes();
  }

  // draws the App
  render() {
    return (
      <div className="App" >
            <h1 className="title">Welcome {this.username}!
                <div className="rightFloat optionsContainer">
                    <button className="mainPageButton" onClick={(e) => this.refresh()}>Refresh</button>
                    <button className="mainPageButton" onClick={(e) => this.toggleOptions(e)} >Options</button>
                    <OptionsMenu
                        ref={(input) => this.optionsMenu = input}
                        logout={this.logout}
                    />
                </div>
        
            
        
        </h1>
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
            resizeStart={this.resizeStart}
            markUnsaved={this.markUnsaved}

            launchOptions={this.rightClickMenu.show}
          />  
        )
        }
        <RightClickMenu 
          ref={(input) => this.rightClickMenu = input}
          updateNoteColor={this.updateNoteColor}
        />
      </div>
    );
  }
}

export default NotePage;
