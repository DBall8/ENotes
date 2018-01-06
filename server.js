var http = require('http')
	, https = require('https')
	, fs = require('fs')
	, qs = require('querystring')
	, url = require('url')
	, crypto = require('crypto')
	, pg = require('pg')
	, port = process.env.PORT || 8081


if (process.env.DATABASE_URL){
	var dbURL = process.env.DATABASE_URL;
}
else {
    var dbURL = require('./secrets.js').dbURL
}

// open the database
var db = new pg.Client(dbURL);
db.connect().then(() =>{
	db.query('CREATE TABLE IF NOT EXISTS users (username VARCHAR(252), hash VARCHAR(252), salt VARCHAR(252), key VARCHAR(252))');
	db.query('CREATE TABLE IF NOT EXISTS notes (key VARCHAR(252), tag VARCHAR(252), content VARCHAR(4096), x INTEGER, y INTEGER, width INTEGER, height INTEGER, zindex INTEGER, colors VARCHAR(512))')
	console.log("Successfully connected to database.");
}, (err) =>{
	console.error("Failed to connect to database.")
	console.error(err)
})

/*
var options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
};
*/

// set up the server
var server = http.createServer(/*options, */function (req, res){
    var uri = url.parse(req.url)

	switch(uri.pathname){
		// send the main page of the App
		case '/':
			sendFile(res, 'build/index.html');
			break;
		// handle API requests for the notes database
		case '/api':
			switch(req.method){
				case 'POST': // Add a note
					addNote(req, res);
					break;
				case 'GET': // Get notes
					getNotes(uri, res);
					break;
				case 'DELETE': // delete a note
					deleteNote(req, res);
					break;
				case 'PUT': // update a note
					updateNote(req, res);
					break;
				default: // bug test
					console.log("METHOD: " + req.method)
			}
			break;
		// handle login attempts
		case '/login':
			login(req, res);
			break;
		// logout request
		case '/logout':
			logout(req, res);
			break;
		// add a new user request
		case '/newuser':
			createNewUser(req, res);
			break;

		// send any other files needed, taken from the build directory
		default:
			// seperate the file name from the extension
			pathLength = uri.pathname.length;
			var fileType = uri.pathname.split('.').pop(); // file extension

			// send the file as a the appropriate file type
			switch(fileType){
				case 'css':
					sendFile(res, __dirname + '/build' + uri.pathname, 'text/css');
					break;
				case 'js':
					sendFile(res, __dirname + '/build' + uri.pathname, 'text/javascript');
					break;
				default:
					sendFile(res, __dirname + '/build' + uri.pathname);
			}
			
	}
})

// object holding mappings from active sessionIDs to the database keys for the user
var sessionIDs = {};

// start the server
server.listen(port);
console.log('Listening on :' + port);


// attempt to log a user in
function login(req, res){
	// read request body
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () =>{
		// convert to json
		var input = JSON.parse(data);

		// attempt to log the user in
		attemptLogin(input, res);
	})
}

function attemptLogin(input, res){

	// search the users table of the database to see if the username is present
	var key = ''; // replace with a key if a username and password match a saved user 

	// (should only be called once)
	db.query("SELECT * FROM users WHERE username=$1", [input.username], function(err, resp){
		if(err){
			console.error("ERROR: could not access usernames\n" + err);
		}
		else{

			resp.rows.map((row) => {
				// hash the password with the same salt and see if it matches the hash saved for that username
				var hash = crypto.createHmac('sha512', row.salt);
				hash.update(input.password);
				var hashVal = hash.digest('hex');
				if(hashVal === row.hash){
					console.log("LOGIN ACCEPTED: " + row.username)
					key = row.key // save this key
				}
				else{
					console.log("LOGIN FAILED: " + row.username)
				}
			})
			
			var response = {}
			// if a login was accepted then a key other than '' will have been stored
			if(key){

				// set a timeout timer for the session
				var time;
				if(input.stayLoggedIn){
					time = 1000 * 60 * 60 * 24 * 7; // ~1 week in milliseconds
				}
				else{
					time = 1000 * 60 * 60 * 3; // 3 hours
				}

				// check if a session ID for this username has already been saved
				var sID = checkIfSessionOpen(input.username);
				// if no, generate a new one from the username and current time
				if(!sID){
					sID = input.username + '-' + Date.now();
					sessionIDs[sID] = {
						key: key,
						timer: setTimeout(function(){ 
							if(sessionIDs[sID]){
								delete(sessionIDs[sID]);
							}
						}, time) // sessionID expires in 3 hours or 1 week depeneding if the user checked "stay logged in"
					};
				}
				else{
					var oldTimer = sessionIDs[sID].timer;
					clearTimeout(oldTimer);
					sessionIDs[sID].timer = setTimeout(function(){ 
						if(sessionIDs[sID]){
							delete(sessionIDs[sID]);
						}
					}, time)
				}
				// build a response object stating that the login was successful and send the generated sessionID
				response = {successful: true, sessionID: sID};		
			}
			else{
				// if no key stored, all logins failed, so send a response stating it was unsuccessful
				response = {successful: false};
			}
			// send response
			res.writeHead(200);
			res.end(JSON.stringify(response));
		}
	})
}


// check if a sesionID for the given username is already stored
function checkIfSessionOpen(username){
	var key = ''; // holds a found sessionID
	// search open sessionIDs for the same username
	Object.keys(sessionIDs).map(function(item){
		// check if the username matches the username of any sessionID
		if(item.substring(0, username.length) === username && item.split('-')[0] === username){
			console.log("returning: " + item)
			key = item; //save the sessionID to use again
		}
	})
	// return any found sessionID of the same user
	return key;
}

// logs the user sessionID out
function logout(req, res){
	// read request data
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () =>{
		// get the sessionID in the request
		var input = JSON.parse(data);
		if(input.sessionID && sessionIDs[input.sessionID]){
			// delete this sessionID
			delete(sessionIDs[input.sessionID])
			console.log(input.sessionID + " has logged out.")
			res.writeHead(200);
		}
		// send response
		res.end();
	})
}


// add a new user to the database
function createNewUser(req, res){
	// read request body
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () => {
		var input = JSON.parse(data);

		// search db to see if username already exists
		var userExists = false;
		db.query("SELECT * FROM users WHERE username=$1", [input.username], function(err, resp){
			if(err){
				console.log(err);
			}
			else{
				// if the username already exists, say so in the response message
				if(resp.rows.length > 0){
					res.writeHead(200);
					res.end(JSON.stringify({
						userAlreadyExists: true
					}))
					console.log("USER '" + input.username + "' ALREADY EXISTS")
				}
				else{
					// if username not found, create a new user
					newUser(input.username, input.password, res);
				}
			}
		});
		
	})
}

// create a new user and send a response
function newUser(username, password, res){

	// generate a 128 byte salt
	var salt = crypto.randomBytes(128).toString('base64');
	// create a hash with the salt
	var hash = crypto.createHmac('sha512', salt);
	// update the hash with the password
	hash.update(password);

	// add a row to the users db table with the username, the hashed value, the salt used, and a unique key generated for this user
	var hashVal = hash.digest('hex');
	// gerenate a unique key and then insert the row 
    generateKey().then((key) => {
		db.query("INSERT INTO users VALUES($1, $2, $3, $4)", [username, hashVal, salt, key]).then(() => {
			// it worked so send a good response
			res.writeHead(200);
			var sID = username + '-' + Date.now();
			sessionIDs[sID] = {
				key: key,
				timer: setTimeout(function(){ 
					if(sessionIDs[sID]){
						delete(sessionIDs[sID]);
					}
				}, 1000 * 60 * 60 * 3) // sessionID expires in 3 hours
			};
			// send repsonse indicating that the user did not already exist so it was successful
			res.end(JSON.stringify({
				userAlreadyExists: false,
				sessionID: sID,
			}));
			console.log("User: " + username + " successfully added.")
		}, (err) => { // on rejection
			// send an error response
			console.error("ERROR could not insert new user:\n" + err);
			res.writeHead(500);
		});
	});
}


// generates a unique key for each user for using to access that user's database
// A different database might be good to make this more efficient
function generateKey(){
	return new Promise((res, rej) => {getNewKey(res, rej)});
}

// generates a random number and sees if its already used, and repeats until a new one is found
function getNewKey(res, rej){
	// crypto safe random number
	var key = crypto.randomBytes(128).toString('base64');
	// search database to see if the key is already in use
	var alreadyExists = false;
	db.query("SELECT * FROM users WHERE key=$1", [key], function(error, resp){
		if(error){
			rej(error)
		}
		else{
			// if key in use, loop again recursively
			if(resp.rows.length > 0){
				getNewKey(res, rej);
			}
			// if key wasnt in use, resolve with the key
			else{
				res(key);
			}
		}
	})
}

// add a note to the database
function addNote(req, res) {
    // read request body
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () => {

		var input = JSON.parse(data);
		
		if(!sessionIDs[input.sessionID]){
			console.error("No key saved for sessionID: " + input.sessionID)
			res.writeHead(200);
			var response = {
				sessionExpired: true
			}
			res.end(JSON.stringify(response));
			return;
		}

		// get the key corresponding to the supplied sessionID
		var key = sessionIDs[input.sessionID].key;

		// add the note to the database
        var values = [key, input.tag, input.content, input.x, input.y, input.width, input.height, input.zindex, JSON.stringify(input.colors)]
        
        db.query('INSERT INTO notes VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', values).then(() =>{
        	// successful
        	console.log(input.tag + " successfully added")
        	res.writeHead(200);
        	var response = {
				sessionExpired: false
			}
			res.end(JSON.stringify(response));
        }, (err) =>{
        	// rejected
        	console.error("Could not insert new note:")
            console.error(err)
            res.writeHead(500);
          	res.end();
      	});	
	})
}

// delete a note from the database
function deleteNote(req, res){
	// read request body
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () => {
		var input = JSON.parse(data);
		
		// if no key stored for the sessionID, respond with sessionExpired
		if(!sessionIDs[input.sessionID]){
			console.error("No key saved for sessionID: " + input.sessionID)
			res.writeHead(200);
			var response = {
				sessionExpired: true
			}
			res.end(JSON.stringify(response));
			return;
		}

		// get key stored with sessionID
		var key = sessionIDs[input.sessionID].key;
        
		// delete note from database
		db.query("DELETE FROM notes WHERE key=$1 AND tag=$2", [key, input.tag]).then(() => {
			console.log(input.tag + " successfully deleted")
			res.writeHead(200)
			var response = {
				sessionExpired: false
			}
			res.end(JSON.stringify(response));
		}, (err) =>{
			console.error("ERROR Could not delete note:\n" + err);
			res.writeHead(500)
			res.end();
		})
        
	})
	
}


// update a note in the database
function updateNote(req, res){
	// read body request
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () => {
		var input = JSON.parse(data);
		
		// if no key stored with sessionID, send sessionExpired
		if(!sessionIDs[input.sessionID]){
			console.error("No key saved for sessionID: " + input.sessionID)
			res.writeHead(200);
			var response = {
				sessionExpired: true
			}
			res.end(JSON.stringify(response));
			return;
		}

		// get the key stored with the sessionID
		var key = sessionIDs[input.sessionID].key;

		// update contents of the note
        var arr = [input.newcontent, input.newx, input.newy, input.newW, input.newH, input.newZ, JSON.stringify(input.newColors), key, input.tag]
		db.query("UPDATE notes SET content=$1, x=$2, y=$3, width=$4, height=$5, zindex=$6, colors=$7 WHERE key=$8 AND tag=$9", arr).then(() =>{
			res.writeHead(200)
			var response = {
				sessionExpired: false
			}
			res.end(JSON.stringify(response));
		}, (err) => {
			console.error("ERROR could not update note" + input.tag + ":\n" + err);
			res.writeHead(500)
			res.end()
		});
	})
}

// send all the notes stored for a user
function getNotes(uri, res){
	// read query sessionID
	var input = qs.parse(uri.query);
	var result = [];

	// if no key for this sessionID, send a sessionExpired
	if(!sessionIDs[input.sessionID]){
		console.error("No key saved for sessionID: " + input.sessionID)
		res.writeHead(200);
		var response = {
			sessionExpired: true
		}
		res.end(JSON.stringify(response));
		return;
	}

	var key = sessionIDs[input.sessionID].key;
	
	// collect all notes stored for the user in an array
	db.query("SELECT * FROM notes WHERE key=$1", [key], function(error, resp){
		// send the array
		res.writeHead(200, {'Content-type': 'application/json'});
		var response = {
			notes: resp.rows,
			sessionExpired: false
		}
		res.end(JSON.stringify(response))
	})
	
}


// send a file
function sendFile(res, filename, type){
	type = type || 'text/html'
	fs.readFile(filename, function (error, content){
		if(error){
			console.log(error);
		}
		res.writeHead(200, {'Content-type': type});
		res.end(content, 'utf-8');

	})
}

