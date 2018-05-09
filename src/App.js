/* App.js
* Main file for managing data throughout the application
*/

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

        // the state is the list of all notes for the logged in user
        this.state = {
            notes: {}
        }

        // track the user's name and the id of their socket
        this.username = '';
        this.socketid = null;
    }

    // function for changing state, not needed now but could be used if I decided the state should store more
    setNoteState(notes){
        this.setState((prevstate) => {
            return {
                notes: notes
            }
        })
    }

    // LIFE CYCLE FUNCTIONS

    // Before the app loads
    componentWillMount(){

        // load notes from DB
        this.getNotes().then(() => {

            // set up the socket for dynamic updating
            //const socket = socketIOClient("https://enotes.site", { secure: true }); // FOR LIVE
            const socket = socketIOClient("130.215.249.227:8080", { secure: true }); // FOR DEV (insert the IP of the host computer)

            // store the socket id (received from server)
            socket.on("ready", (socketid) => {
                this.socketid = socketid;
            })

            // Update an existing note that has been changed elsewhere
            socket.on("update", (body) => {

                var input = JSON.parse(body);

                // attempt to parse colors json
                var newColors;
                try {
                    newColors = JSON.parse(input.newColors);
                }
                catch (e) {
                    newColors = {}; // default to empty
                }

                // check the note does exist
                var notes = { ...this.state.notes };
                if (!notes[input.tag]) {
                    return;
                }
                var note = notes[input.tag];

                // update the note
                note.content = input.newcontent;
                note.x = input.newx;
                note.y = input.newy;
                note.width = input.newW;
                note.height = input.newH;
                note.zindex = input.newZ;
                note.colors = newColors;

                // update state
                this.setState({ notes });
            })

            // Create a note locally that was created elsewhere
            socket.on("create", (body) => {
                var input = JSON.parse(body);
                // attempt to parse colors json
                var colors;
                try {
                    colors = JSON.parse(input.colors);
                }
                catch (e) {
                    colors = {}; // use empty default
                }

                // create the new note
                var n = new note(input.content, input.x, input.y, input.width, input.height, colors);
                n.zindex = input.zindex;

                // add the new node
                var notes = { ...this.state.notes };
                notes[input.tag] = n;
                this.setState({ notes });
            })

            // Delete a note locally that was deleted elsewhere
            socket.on("delete", (tag) => {
                // remove the note
                var notes = { ...this.state.notes };
                delete notes[tag];
                this.setState({ notes });
            })

            // let the server know that this user's socket is ready
            socket.emit("ready", this.username);

        });
    }

    componentDidMount() {
    }

    // DATA MANAGEMENT FUNCTIONS - notifies the server of changes so that the server can update the database

    // Request all notes for the logged in user from the server
    getNotes(){
        // fetch from /api
        return fetch("/api", {
            method: "GET",
            credentials: 'same-origin'
        })
        // Handle http response
        .then((res) => {
            // Handle error responses
            if (res.status !== 200) {
                console.error(res);
                return null;
            }
            // Handle a redirect (back to login page)
            else if (res.redirected) {
                window.location.href = '/login';
            }
            // Success, handle the request body as json
            else{ return res.json()}
        }) 
        // Handle the response body
        .then((data) => {
            // If the session has expired, redirect to login page
            if(data.sessionExpired){
                window.location.href = "/login";
            }
            // Store the user's name
            this.username = data.username;
            // pass the data to the load notes function
            this.loadNotes(data.notes);
            // if no notes were loaded, create a new one
            if (Object.keys(this.state.notes).length <= 0) {
                this.addNote(100, 100);
            }
        });
    }

    // Loads a list of JSONs representing notes into the App's state
    // INPUT - data - a list of JSON objects representing notes
    loadNotes(data){

        // New notes object for the state
        var notes = {}

        // add a new note class for each object
        data.map((anote) => {
            // build note class

            // parse colors into a json
            var colors;
            try{
                colors = JSON.parse(anote.colors);
            }
            catch(e){
                console.error("Failed to parse colors json");
                console.error(e);
                console.error(anote.colors);
                colors = {}; // default to empty (handled as default)
            }

            // Make new class instance
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
    // INPUT - x - the x coordinate to add the note at
    // INPUT - y - the y coordinate to add the note at
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

        // add to state with time stamp as a tag
        var t = `note-${Date.now()}`
        notes[t] = n;
        this.setNoteState(notes);

        // Notify the server about the new note
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
            // Handle http error response
            if(result.status !== 200){
                console.error("ERROR: Server response: " + result.status)
                console.error(result.statusText);
            }
            // Handle a redirect to login page
            else if (result.redirected) {
                window.location.href = '/login';
            }
            // Request successfull, continute with the body of the response as a JSON
            else{
                return result.json();
            }
            return;
        }).then((res) => {
            // Check if the session has expired, redirect to login page if so
            if(res.sessionExpired){
                window.location.href = '/login';
            }

        });
    
    }

    // Delete a note
    // INPUT - tag - the tag of the note to delete
    deleteNote(tag) {

        // Delete the note locally
        var notes = {...this.state.notes}
        notes[tag] = null;
        delete(notes[tag]);
        this.setNoteState(notes);

        // Tell the server which note to remove, all thats needed is its tag
        fetch("/api", {
            method: "DELETE",
            credentials: 'same-origin',
            body: JSON.stringify({
                tag: tag,
                socketid: this.socketid
            })
        }).then((result) => {
            // Handle error response
            if(result.status !== 200){
                console.error("ERROR: Server response: " + result.status)
                console.error(result.statusText);
            }
            // Handle a redirect to login page
            else if (result.redirected) {
                window.location.href = '/login';
            }
            // Delete request successful, continue with body of the response as a JSON
            else{
                return result.json();
            }
        }).then((res) => {
            // If session has expired, redirect to login page
            if(res.sessionExpired){
                window.location.href = '/login';
            }
        });
    }

    // Notify the server about a change to a note (change must already have been made locally to the state)
    // INPUT - tag - the tag of the note to update the server about
    updateNote(tag) {
        var notes = { ...this.state.notes };
        var note = notes[tag];

        // Update successfull so mark the note as saved 
        // (Didnt want to wait for success response in to avoid whiping a new state change that happens before the http response)
        note.saved = true;
        this.setState({ notes });

        // Tell the server everything about the current state of the note
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
            // Handle http error
            if(result.status !== 200){
                console.error("ERROR: Server response: " + result.status)
                console.error(result.statusText);
            }
            // Handle a redirect to login page
            else if (result.redirected) {
                window.location.href = '/login';
            }
            // Success, ready response body as JSON
            else{
                return result.json();
  
            }
        }).then((res) => {
            // Check if session expired and redirect to login page if it did
            if(res.sessionExpired){
                window.location.href = '/login';
            }
        });

    }

    // FUNCTIONS FOR CHANGING NOTES - changes notes in the state without necessarily notifying the server

    // Change the text on a note
    // INPUT - tag - the tag of the note to change
    // INPUT - content - the new text content of the note
    changeNoteText(tag, content) {
        // get note
        var notes = { ...this.state.notes };
        var note = notes[tag];
        // change note, marking it as changed
        note.content = content;
        note.saved = false;
        // update state
        this.setState({ notes });
    }

    // Change the position of a note
    // INPUT - tag - the tag of the note to change
    // INPUT - x - the new x coordinate of the note
    // INPUT - y - the new y coordinate of the note
    changeNotePosition(tag, x, y) {
        // get the note
        const notes = { ...this.state.notes }
        var note = notes[tag];
        // change the note
        note.x = x;
        note.y = y;
        // update state
        this.setState({ notes });
    }

    // Change the size of a note
    // INPUT - tag - the tag of the note to change
    // INPUT - w - the new width of the note
    // INPUT - h - the new height of the note
    changeNoteSize(tag, w, h) {
        // get the note
        const notes = { ...this.state.notes }
        var note = notes[tag];
        // change the note
        note.width = w;
        note.height = h;
        // update the state
        this.setState({ notes });
    }

    // Change the color of a note
    // INPUT - tag - the tag of the note to change
    // INPUT - newcolor - a json representing the new color of the note
    changeNoteColor(tag, newcolor) {
        // get the note and set its new color
        var notes = { ...this.state.notes };
        notes[tag].colors = newcolor;
        // update state and then update the server after its finished
        this.setState({ notes: notes }, () => {
            this.updateNote(tag)
        });
    }

    // Make a note selected
    // INPUT - tag - the tag of the note to select
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

    // Logs out the user
    logout(){
        // Send a request to /logout so the server can remove the user's session
        fetch("/logout", {
            method: "POST",
            credentials: 'same-origin'
        }).then((result) => {
            // Handle http error
            if(result.status !== 200){
                console.error("ERROR: Server response: " + result.status)
                console.error(result.statusText);
            }
            else {
                // successful so redirect to login
                window.location.href = "/login";
            }
        });
    }


    // Draws the App
    // Essentially just loads the NotePage class which can use this class's methods to manipulate the data
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
