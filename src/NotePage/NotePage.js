/* NotePage.js
* A class for handling all display logic and user interaction with the main Note page of the application.
*/

import React from 'react';

import './NotePage.css';
import Note from '../note/note';
import note from '../note/note-class';
import RightClickMenu from '../right-click-menu/rightClickMenu';
import OptionsMenu from '../options-menu/optionsMenu';
import ColorChart from '../resources/colorChart';
import refreshIm from '../resources/refresh-icon.png'
import gearIm from '../resources/gear.png'

class NotePage extends React.Component{

    constructor() {
        super();

        // bind functions needed by subclasses
        this.dragStart = this.dragStart.bind(this);
        this.resizeStart = this.resizeStart.bind(this);
        this.updateNoteText = this.updateNoteText.bind(this);
        this.copy = this.copy.bind(this);
        this.saveToMyClipboard = this.saveToMyClipboard.bind(this);
        this.retrieveFromMyClipboard = this.retrieveFromMyClipboard.bind(this);
        this.paste = this.paste.bind(this);

        // A list of reference objects to all Note subclasses
        this.notes = {};
        // local "clipboard" for copying and pasting using right click menu
        this.clipboard = '';

        // Store a default color, may make this a user setting in the future
        this.defaultColors = ColorChart.yellow;
        // Track if there are any notes that have been changed but not saved
        this.unsaved = false;

        // objects to hold info about the dragging or resizing note
        this.drag = {};
        this.resize = {};
    }

    // Before the component loads
    componentWillMount() {

        // Add a click event to the window
        window.addEventListener('click', (event) => {

            var rightClick = false; // did the user click the right mouse button?

            // If the browser uses "which" for the mouse key look for mouse 3
            if ("which" in event) {
                //console.log("WHICH: " + e.which);
                rightClick = event.which == 3;
            }
            // If the browser uses "button" for the mouse key look for mouse 2
            if ("button" in event) {
                //console.log("BUTTON: " + e.button);
                rightClick = event.button == 2;
            }

            // Essentially, look for a user clicking outside of a context menu and close that menu

            // If custom right click menu is shown and the right mouse button was not clicked, hide the menu
            if (!rightClick && this.rightClickMenu && this.rightClickMenu.state.display === 'block') {
                this.rightClickMenu.hide();
            }
            // If the options menu is shown and the right mouse button was not clicked, hide the options menu
            if (!rightClick && this.optionsMenu && this.optionsMenu.state.display === 'block') {
                this.optionsMenu.toggleDisplay();
            }

        })

        // Add a mouse up event for ending resize and drag events
        window.addEventListener('mouseup', (event) => {
            this.dragEnd(event)
            this.resizeEnd(event)

        });

        // Add a mouse move event for listing for drag and resize actions
        window.addEventListener('mousemove', (event) => {
            this.dragDuring(event)
            this.resizeDuring(event)
        });
    }

    // After the component has loaded
    componentDidMount() {

        // Set up a clock that periodically checks if any notes have been changed
        // If any note has changed, update the server about its changes
        // Otherwise dont do anything
        window.setInterval(() => {
            if (this.unsaved) {
                this.unsaved = false;
                var notes = this.props.notes
                Object.keys(notes).map((t) => {
                    if (!notes[t].saved) {
                        this.props.updateNote(t);
                    }
                    return;
                })

            }

        }, 1000)
    }

    

    // Start dragging a note
    // INPUT - tag - the tag of the note being dragged
    // INPUT - x - the x coordinate the mouse started at
    // INPUT - y the y coordinate the mouse started at
    dragStart(tag, x, y) {
        // save the offset from the corner of the note, so when dragging the note will move with the cursor
        var note = this.props.notes[tag];
        this.drag = { tag: tag, offsetX: x - note.x, offsetY: y - note.y }
    }


    // Move a note to the cursor when the cursor is moved and a note is being dragged
    // INPUT - e - the mouse event
    dragDuring(e) {
        // Quit if nothing is being dragged
        if (!this.drag.tag) {
            return;
        }

        // move note to the cursor minus the offset
        var x = e.screenX - this.drag.offsetX;
        var y = e.screenY - this.drag.offsetY;
        // update state
        this.props.changeNotePosition(this.drag.tag, x, y)
    }

    // Stop a dragging note
    // INPUT - e - the mouse event
    dragEnd(e) {
        // If nothing is being dragged, return
        if (!this.drag.tag) {
            return;
        }

        // Since dragging has finished, tell the server about the new position of the note
        this.props.updateNote(this.drag.tag)
        // Wipe drag information
        this.drag = {};
    }

    // Start resizing a note
    // INPUT - tag - the tag of the note being dragged
    // INPUT - x - the x coordinate the mouse started at
    // INPUT - y the y coordinate the mouse started at
    resizeStart(tag, x, y) {
        // save the offset from the corner of the note, so when resizing the note size will move with the cursor
        this.resize = { tag: tag, startX: x, startY: y }
    }

    // Stretch a note to the cursor when the cursor is moved and a note is being resized
    // INPUT - e - the mouse event
    resizeDuring(e) {
        // quit now if nothing is being resized
        if (!this.resize.tag) {
            return;
        }
        // grab the note
        var note = this.props.notes[this.resize.tag];

        // get the new dimensions of the note from the old note size and the change in the mouse position
        var newWidth = note.width + e.screenX - this.resize.startX;
        this.resize.startX = e.screenX;
        var newHeight = note.height + e.screenY - this.resize.startY;
        this.resize.startY = e.screenY;
        // update the state
        this.props.changeNoteSize(this.resize.tag, newWidth, newHeight);
    }

    // Finish a resize event
    // INPUT - e - the mouse event
    resizeEnd(e) {
        // Return if nothing was being resized
        if (!this.resize.tag) {
            return;
        }

        // tell the server about the note's new size
        this.props.updateNote(this.resize.tag)
        // empty out stored resize information
        this.resize = {};
    }

    // Intercept the updating of the state to mark that a note has changed and should be updated
    // (pass both inputs upwards)
    updateNoteText(tag, content) {
        this.unsaved = true;
        this.props.changeNoteText(tag, content);
    }

    // Pass a copy call from a right click menu down to the Note class that is currently selected
    copy() {
        // Find selected note
        Object.keys(this.props.notes).map((t) => {
            var n = this.props.notes[t]
            if (n.selected) {
                // pass down copy event
                this.notes[t].copy();
            }
        })
    }

    // Pass a paste call from a right click menu down to the Note class that is currently selected
    paste() {
        // Find the selected note
        Object.keys(this.props.notes).map((t) => {
            var n = this.props.notes[t]
            if (n.selected) {
                // Pass down the paste event
                this.notes[t].paste();
            }
        })
    }

    // Save some selected text to the "clipboard" for copy/pasting
    // INPUT - val - text to save
    saveToMyClipboard(val) {
        this.clipboard = val;
    }

    // Get whatever is saved on the "clipboard" currently
    // OUTPUT - text saved on the clipboard
    retrieveFromMyClipboard() {
        console.log(this.clipboard)
        return this.clipboard;
    }

    // Hide or show options menu
    // INPUT - e - click event
    toggleOptions(e) {
        // stop the even from propogating
        e.stopPropagation()
        // hide or show options menu
        this.optionsMenu.toggleDisplay();
    }


    // Draws all user interface elements for the main part of the application
    render() {
        return (
            <div className="NotePage" >
                <h1 className="title"><span className="welcomeMessage">Welcome {this.props.username}!</span>
                    <div className="rightFloat optionsContainer">
                        <input type="image" src={gearIm} className="mainPageButton button" onClick={(e) => this.toggleOptions(e)} />
                        <OptionsMenu
                            ref={(input) => this.optionsMenu = input}
                            logout={this.props.logout}
                        />
                    </div>

                </h1>
                {Object.keys(this.props.notes).map((key) =>
                    <Note
                        ref={(input) => this.notes[key] = input}
                        key={key}
                        tag={key}
                        note={this.props.notes[key]}
                        addNote={this.props.addNote}
                        deleteNote={this.props.deleteNote}
                        updateNote={this.props.updateNote}
                        selectNote={this.props.selectNote}
                        dragStart={this.dragStart}
                        resizeStart={this.resizeStart}
                        updateNoteText={this.updateNoteText}
                        saveToMyClipboard={this.saveToMyClipboard}
                        retrieveFromMyClipboard={this.retrieveFromMyClipboard}
                        launchOptions={this.rightClickMenu.show}
                    />
                )
                }
                <RightClickMenu
                    ref={(input) => this.rightClickMenu = input}
                    changeNoteColor={this.props.changeNoteColor}
                    copy={this.copy}
                    paste={this.paste}
                />
            </div>
        );
    }
}

export default NotePage;