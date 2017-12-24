var sql = require('sqlite3');

var db = new sql.Database('./data.db');

db.serialize(function(){
	db.run('CREATE TABLE users (username VARCHAR(252), password VARCHAR(252), key VARCHAR(252))');
	db.run('CREATE TABLE notes (key VARCHAR(252), content VARCHAR(4096), x INTEGER, y INTEGER, width INTEGER, height INTEGER, zindex INTEGER)')
})

db.close();