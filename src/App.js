import React from 'react';
import socketIOClient from "socket.io-client";

import NotePage from './NotePage/NotePage';
import note from './note/note-class';
import './App.css';
import ColorChart from './resources/colorChart';

class App extends React.Component {

    constructor(){
        super();

        // bind functions for each Note component
        this.addNote = this.addNote.bind(this);
        this.deleteNote = this.deleteNote.bind(this);
        this.updateNote = this.updateNote.bind(this);
        this.logout = this.logout.bind(this);
        this.changeNoteText = this.changeNoteText.bind(this);
        this.changeNotePosition = this.changeNotePosition.bind(this);
        this.changeNoteSize = this.changeNoteSize.bind(this);
        this.changeNoteColor = this.changeNoteColor.bind(this);
        this.selectNote = this.selectNote.bind(this);

        // watch the state of each note
        this.state = {
            notes: {}
        }

        this.username = '';
        this.socketid = null;
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

        // load notes from DB
        this.getNotes().then(() => {

            // set up the socket for dynamic updating
            //const socket = socketIOClient("https://enotes.site", { secure: true });
            const socket = socketIOClient("192.168.1.16:8080", { secure: true });

            socket.on("ready", (socketid) => {
                this.socketid = socketid;
            })
            
            socket.on("update", (body) => {

                var input = JSON.parse(body);

                var newColors;
                try {
                    newColors = JSON.parse(input.newColors);
                }
                catch (e) {
                    console.log("Could not convert colors.");
                    console.log(input.newColors);
                    newColors = {};
                }

                var notes = { ...this.state.notes };
                if (!notes[input.tag]) {
                    return;
                }
                var note = notes[input.tag];
                
                note.content = input.newcontent;
                note.x = input.newx;
                note.y = input.newy;
                note.width = input.newW;
                note.height = input.newH;
                note.zindex = input.newZ;
                note.colors = newColors;

                this.setState({ notes });
                

            })

            socket.on("create", (body) => {
                var input = JSON.parse(body);
                
                var colors;
                try {
                    colors = JSON.parse(input.colors);
                }
                catch (e) {
                    colors = {};
                }

                var n = new note(input.content, input.x, input.y, input.width, input.height, colors);
                n.zindex = input.zindex;

                var notes = { ...this.state.notes };
                notes[input.tag] = n;
                this.setState({ notes });
                

            })

            socket.on("delete", (tag) => {
                var notes = { ...this.state.notes };
                delete notes[tag];
                this.setState({ notes });
            })
            
            socket.emit("ready", this.username);

        });
    }

    componentDidMount() {
    }

    // DATA MANAGEMENT FUNCTIONS

    // ask server for notes
    getNotes(){
    // fetch from /api
        //* FETCH
        return fetch("/api", {
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
                colors: n.colors,
                socketid: this.socketid
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
                tag: tag,
                socketid: this.socketid
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
    }

    updateNote(tag) {
        var notes = { ...this.state.notes };
        var note = notes[tag];

        // update DB
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
                newColors: JSON.stringify(note.colors),
                socketid: this.socketid
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

    }

    changeNoteText(tag, content) {
        var notes = { ...this.state.notes };
        var note = notes[tag];
        note.content = content;
        note.saved = false;
        this.unsaved = true;
        this.setState({ notes });

    }

    changeNotePosition(tag, x, y) {
        const notes = { ...this.state.notes }
        var note = notes[tag];
        note.x = x;
        note.y = y;
        this.setState({ notes });
    }

    changeNoteSize(tag, w, h) {
        const notes = { ...this.state.notes }
        var note = notes[tag];
        note.width = w;
        note.height = h;
        this.setState({ notes });
    }
    
    changeNoteColor(tag, newcolor) {
        var notes = { ...this.state.notes };
        notes[tag].colors = newcolor;
        this.setState({ notes: notes }, () => {
            this.updateNote(tag)
        });
    }

    // Select a note
    selectNote(tag) {
        // if already selected, done
        if (this.state.notes[tag].selected) {
            return;
        }

        // go through each note, deselecting it and moving it back 1
        // or if it is the note to select, select it and bring it to front
        var notes = this.state.notes;
        Object.keys(notes).map((k) => {
            if (k === tag) {
                notes[k].selected = true;
                notes[k].zindex = 9999;
            }
            else {
                notes[k].selected = false;
                if (notes[k].zindex > 0) {
                    notes[k].zindex--;
                }

            }
            return;
        })
        // update state
        this.setState({ notes });
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


    // draws the App
    render() {
        return (
            <NotePage
                notes={this.state.notes}
                username={this.username}
                addNote={this.addNote}
                deleteNote={this.deleteNote}
                updateNote={this.updateNote}
                setNoteState={this.setNoteState}
                logout={this.logout}
                changeNoteText={this.changeNoteText}
                changeNotePosition={this.changeNotePosition}
                changeNoteSize={this.changeNoteSize}
                changeNoteColor={this.changeNoteColor}
                selectNote={this.selectNote}
            />
        );
    }
}

export default App;
