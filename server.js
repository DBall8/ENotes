var http = require('http')
	, https = require('https')
	, fs = require('fs')
	, qs = require('querystring')
	, url = require('url')
	, crypto = require('crypto')
	, sql = require('sqlite3')
	, pg = require('pg')
	, port = 8080
	, dbURL = DATABASE_URL || 'postgres://localhost:8080/'

// open the database
/*
var db = new sql.Database('./data.db', sql.OPEN_READWRITE, function(err){
	if(err){
		console.error("Could not open database.");
		console.error(err);
	}
	else{
		console.log("Database opened successfully.");
	}
})
*/

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
	db.each("SELECT * FROM users WHERE username=(?)", [input.username], function(err, row){
		if(err){
			console.error("ERROR: could not access usernames\n" + err);
		}
		else{
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
		}
	}, function(){ // after searching the database ...
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
		db.each("SELECT * FROM users WHERE username=(?)", [input.username], function(err, row){
			if(err){
				console.log(err);
			}
			else{
				// the username was found in the db
				userExists = true;
			}
		}, function(){
			// if the username already exists, say so in the response message
			if(userExists){
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
		})
		
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
        dbInsert('users', [username, hashVal, salt, key]).then((success) => {
            if (success) {
                // it worked so send a good response
                res.writeHead(200);
                var sID = username + '-' + Date.now();
                sessionIDs[sID] = {
                    key: key,
                    timer: setTimeout(function () {
                        if (sessionIDs[sID]) {
                            delete (sessionIDs[sID]);
                        }
                    }, 1000 * 60 * 60 * 3) // sessionID expires in 3 hours
                };
                // send repsonse indicating that the user did not already exist so it was successful
                res.end(JSON.stringify({
                    userAlreadyExists: false,
                    sessionID: sID,
                }));
                console.log("User: " + username + " successfully added.")
            }
            else {
                res.writeHead(500);
                res.end();
            }
        })
        /*
		db.run("INSERT INTO users VALUES((?), (?), (?), (?))", [username, hashVal, salt, key], function(err){
			if(err){
				// send an error response
				console.error("ERROR could not insert new user:\n" + err);
				res.writeHead(500);
			}
			else{
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
			}
		});
        */
	});
}


// generates a unique key for each user for using to access that user's database
// A different database might be good to make this more efficient
function generateKey(){
	return new Promise((res, rej) => getNewKey(res, rej));
}

// generates a random number and sees if its already used, and repeats until a new one is found
function getNewKey(res, rej){
	// crypto safe random number
	var key = crypto.randomBytes(128).toString('base64');
	// search database to see if the key is already in use
	var alreadyExists = false;
	db.each("SELECT * FROM users WHERE key=(?)", [key], function(error, result){
		if(error){
			rej(error)
		}
		else{
			// key is already in use
			alreadyExists = true;
		}
	}, function(){
		// if key in use, loop again recursively
		if(alreadyExists){
			getNewKey(res, rej);
		}
		// if key wasnt in use, resolve with the key
		else{
			res(key);
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
        var values = [key, input.tag, input.content, input.x, input.y, input.width, input.height, input.zindex]
        dbInsert('notes', values).then((success) => {
            if (success) {
                res.writeHead(200);
                var response = {
                    sessionExpired: false
                }
                res.end(JSON.stringify(response));
            }
            else {
                res.writeHead(500);
                res.end();
            }
        })
        /*
		db.serialize(function(){
            db.run('INSERT INTO notes VALUES ((?), (?), (?), (?), (?), (?), (?), (?))', values, function (err) {
                if (err) {
                    console.error("Could not insert new note:")
                    console.error(err)
                    res.writeHead(500);
                  	res.end();
                } 
                else{
                	// successful
                	console.log(input.tag + " successfully added")
                	res.writeHead(200);
                	var response = {
						sessionExpired: false
					}
					res.end(JSON.stringify(response));
            	}
            });
		})
        */
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

        dbDelete('notes', {
            key: key,
            tag: input.tag
        }).then((success) => {
            if (success) {
                
                res.writeHead(200)
                var response = {
                    sessionExpired: false
                }
                res.end(JSON.stringify(response));

                console.log(input.tag + " successfully deleted")
            }
            else {
                res.writeHead(500)
                res.end();
            }
        })
        /*
		// delete note from database
		db.run("DELETE FROM notes WHERE key=(?) AND tag=(?)", [key, input.tag], function(err){
			if(err){
				console.error("ERROR Could not delete note:\n" + err);
				res.writeHead(500)
				res.end();
			}
			else{
				console.log(input.tag + " successfully deleted")
				res.writeHead(200)
				var response = {
					sessionExpired: false
				}
				res.end(JSON.stringify(response));
			}
		})
        */
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
        
        dbUpdate('notes',
            // criteria
            {
                key: key,
                tag: input.tag
            },
            // new values
            {
                content: input.newcontent,
                x: input.newx,
                y: input.newy,
                width: input.newW,
                height: input.newH,
                zindex: input.newZ
            }
        ).then((success) => {
            if (success) {
                res.writeHead(200)
                var response = {
                    sessionExpired: false
                }
                res.end(JSON.stringify(response));
                    
            }
            else {
                console.error("ERROR could not update note" + input.tag + ":\n" + err);
                res.writeHead(500)
                res.end()
            }
        })
        /*
        var arr = [input.newcontent, input.newx, input.newy, input.newW, input.newH, input.newZ, key, input.tag]
		db.serialize(() =>{
			db.run("UPDATE notes SET content=(?), x=(?), y=(?), width=(?), height=(?), zindex=(?) WHERE key=(?) AND tag=(?)", arr, function(err){
				if(err){
					console.error("ERROR could not update note" + input.tag + ":\n" + err);
					res.writeHead(500)
					res.end()
				}
				else{
					res.writeHead(200)
					var response = {
						sessionExpired: false
					}
					res.end(JSON.stringify(response));
				}
			})
		})
        */
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

	dbEach('notes', {key: key}, )
	
	// collect all notes stored for the user in an array
	db.each("SELECT * FROM notes WHERE key=(?)", [key], function(error, row){
		result.push(row);
	}, function(){
		// send the array
		res.writeHead(200, {'Content-type': 'application/json'});
		var response = {
			notes: result,
			sessionExpired: false
		}
		res.end(JSON.stringify(response))
	})
	
}

function dbInsert(table, vals) {
    return new Promise((resolve, reject) => {
        var numVals = vals.length;
        var insertStr = "INSERT INTO " + table + " VALUES (";
        var valStr = vals.map((item) => {
            return '(?)'
        }).join(', ');

        insertStr += valStr + ')';

        db.run(insertStr, vals, function (err) {
            if (err) {
                console.error("Could not insert into " + table)
                console.error(err)
                resolve(false);
            }
            else {
                resolve(true);
            }
        })
    })
}

function dbDelete(table, valsObj) {
    return new Promise((resolve, reject) => {
        var deleteStr = "DELETE FROM " + table + " WHERE ";
        var vals = [];
        var criteria = Object.keys(valsObj).map((key) => {
            vals.push(valsObj[key]);
            return '' + key + '=(?)';
        }).join(' AND ');

        deleteStr += criteria;
        console.log(deleteStr);

        db.run(deleteStr, vals, function (err) {
            if (err) {
                console.error("Could not delete from " + table)
                console.error(err)
                resolve(false)
            }
            else {
                resolve(true);
            }
        })
    })
}

function dbUpdate(table, criteriaObj, valsObj) {
    return new Promise((resolve, reject) => {
        var insertStr = "UPDATE " + table + " SET ";

        var vals = [];
        var valStr = Object.keys(valsObj).map((key) => {
            vals.push(valsObj[key]);
            return '' + key + '=(?)';
        }).join(', ');

        var criteria = [];
        var criteriaStr = Object.keys(criteriaObj).map((key) => {
            criteria.push(criteriaObj[key]);
            return '' + key + '=(?)';
        }).join(' AND ');

        var insertStr = insertStr + valStr + ' WHERE ' + criteriaStr;
        var arr = [...vals, ...criteria]

        db.run(insertStr, arr, function (err) {
            if (err) {
                console.error("Could not update " + table)
                console.error(err)
                resolve(false)
            }
            else {
                resolve(true);
            }
        })
    })
}

function dbEach(table, criteriaObj, function){
	var selectStr = "SELECT * FROM " + table + " WHERE ";

	var criteria = [];
	var criteriaStr = Objects.keys(criteriaObj).map((key) => {
		criteria.push(criteriaObj[key]);
		return '' + key + '=(?)'
	}).join(' AND ');

	var selectStr == criteriaStr;

	db.each(selectStr, criteria, function(err, row))
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

