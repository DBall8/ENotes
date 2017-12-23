var sql = require('sqlite3');

var db = new sql.Database('./data.db');

db.serialize(function(){
	db.run('CREATE TABLE users (username varchar(252), password varchar(252))');
	db.run('CREATE TABLE notes (title varchar(2048), content varchar(4096), x int, y int)')
})

db.close();