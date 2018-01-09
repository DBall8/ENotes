export default class note{
	constructor(content, x, y, width, height, colors){
		this.content = content;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.selected = false;
		this.zindex = 9000;
		this.saved = true;
		this.colors = colors;
	}
}