export default class note{
	constructor(title, content, x, y, width, height){
		this.title = title;
		this.content = content;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.selected = false;
	}
}