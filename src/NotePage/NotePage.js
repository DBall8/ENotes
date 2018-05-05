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

        this.dragStart = this.dragStart.bind(this);
        this.resizeStart = this.resizeStart.bind(this);
        this.copy = this.copy.bind(this);
        this.saveToMyClipboard = this.saveToMyClipboard.bind(this);
        this.retrieveFromMyClipboard = this.retrieveFromMyClipboard.bind(this);
        this.paste = this.paste.bind(this);


        this.notes = {};
        this.clipboard = '';

        this.defaultColors = ColorChart.yellow;
        this.unsaved = false;

        // object to hold info about the dragging note
        this.drag = {};
        this.resize = {};
    }

    componentWillMount() {
        window.addEventListener('click', (event) => {
            var rightClick = false;
            if ("which" in event) {
                //console.log("WHICH: " + e.which);
                rightClick = event.which == 3;
            }
            if ("button" in event) {
                //console.log("BUTTON: " + e.button);
                rightClick = event.button == 2;
            }

            if (!rightClick && this.rightClickMenu && this.rightClickMenu.state.display === 'block') {
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
    }

    componentDidMount() {
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

    

    // start dragging a note
    dragStart(tag, x, y) {
        // save the offset from the corner of the note, so when dragging the note will move with the cursor
        var note = this.props.notes[tag];
        this.drag = { tag: tag, offsetX: x - note.x, offsetY: y - note.y }
    }


    // Move a note to the cursor when the cursor is moved and a note is being dragged
    dragDuring(e) {
        // quit now if nothing is being dragged
        if (!this.drag.tag) {
            return;
        }

        // move note to the cursor minue the offset
        var x = e.screenX - this.drag.offsetX;
        var y = e.screenY - this.drag.offsetY;
        // update state
        this.props.changeNotePosition(this.drag.tag, x, y)
    }

    // stops a dragging note
    dragEnd(e) {
        if (!this.drag.tag) {
            return;
        }

        this.props.updateNote(this.drag.tag)
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
        var note = this.props.notes[this.resize.tag];

        // move note to the cursor minue the offset
        var newWidth = note.width + e.screenX - this.resize.startX;
        this.resize.startX = e.screenX;
        var newHeight = note.height + e.screenY - this.resize.startY;
        this.resize.startY = e.screenY;
        // update state
        this.props.changeNoteSize(this.resize.tag, newWidth, newHeight);
    }

    resizeEnd(e) {
        if (!this.resize.tag) {
            return;
        }

        this.props.updateNote(this.resize.tag)
        this.resize = {};
    }

    copy() {
        Object.keys(this.props.notes).map((t) => {
            var n = this.props.notes[t]
            if (n.selected) {
                this.notes[t].copy();
            }
        })
    }

    paste() {
        Object.keys(this.props.notes).map((t) => {
            var n = this.props.notes[t]
            if (n.selected) {
                this.notes[t].paste();
            }
        })
    }

    saveToMyClipboard(val) {
        this.clipboard = val;
    }

    retrieveFromMyClipboard() {
        console.log(this.clipboard)
        return this.clipboard;
    }

    toggleOptions(e) {
        e.stopPropagation()
        this.optionsMenu.toggleDisplay();
    }


    // draws the App
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
                        changeNoteText={this.props.changeNoteText}
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