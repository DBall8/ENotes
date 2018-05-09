/* note-class.js
* Simple class for storing information about a note
*/

export default class note{
	constructor(content, x, y, width, height, colors){
		this.content = content; // the note's text
		this.x = x; // x coordinate
		this.y = y; // y coordinate
		this.width = width; // the width of the note
		this.height = height; // the height of the note
		this.selected = false; // whether or not the note is currently selected
		this.zindex = 9000; // the position depth wise of the note
		this.saved = true; // whether or not the note is saved or has unsaved changes
		this.colors = colors; // a JSON containing the colors of the note
	}
}