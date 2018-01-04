/*
var sql = require('sqlite3');

var db = new sql.Database('./data.db');

db.serialize(function(){
	db.run('CREATE TABLE users (username VARCHAR(252), hash VARCHAR(252), salt VARCHAR(252), key VARCHAR(252))');
	db.run('CREATE TABLE notes (key VARCHAR(252), tag VARCHAR(252), content VARCHAR(4096), x INTEGER, y INTEGER, width INTEGER, height INTEGER, zindex INTEGER)')
})

db.close();
*/

var pg = require('pg');
var connectionURL = process.env.DATABASE_URL || 'postgres://localhost:5432/todo'

const client = new pg.Client(connectionURL);
client.connect().then(() => {
	console.log("HELLO\n\n\n\n");
	const query = client.query('CREATE TABLE users (username VARCHAR(252), hash VARCHAR(252), salt VARCHAR(252), key VARCHAR(252))', (err) => {
		console.log('error');
	})
	query.on('end', () => console.log('end'));
})
/*
query.on('end', () => {
	const q2 = client.query('CREATE TABLE notes (key VARCHAR(252), tag VARCHAR(252), content VARCHAR(4096), x INTEGER, y INTEGER, width INTEGER, height INTEGER, zindex INTEGER)')
	q2.on('end', () => client.end())
})
	*/
