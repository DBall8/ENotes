var http = require('http')
	, fs = require('fs')
	, qs = require('querystring')
	, url = require('url')
	, sql = require('sqlite3')
	, port = 8080

var db = new sql.Database('./data.db', sql.OPEN_READWRITE, function(err){
	if(err){
		console.log("Could not open database.");
		console.log(err);
	}
	else{
		console.log("Database opned successfully.");
	}
})

var server = http.createServer(function (req, res){
    var uri = url.parse(req.url)

	switch(uri.pathname){
		case '/':
			sendFile(res, 'build/index.html');
			break;
		case '/api':
			switch(req.method){
				case 'POST':
					addNote(req, res);
					break;
				case 'GET':
					getNotes(uri, res);
					break;
				case 'DELETE':
					deleteNote(uri,res);
					break;
				case 'PUT':
					updateNote(req, res);
					break;
				default:
					console.log("METHOD: " + req.method)
			}
			break;
		default:
			pathLength = uri.pathname.length;
			var fileType = uri.pathname.split('.').pop();
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

server.listen(port);
console.log('Listening on :' + port);


function addNote(req, res) {
    console.log("IN ADD");
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () => {
		console.log(data);

		var input = JSON.parse(data);

        var values = ['aaaaaa', input.tag, input.content, input.x, input.y, input.width, input.height, input.zindex]

        console.log(values)
 
		db.serialize(function(){
            db.run('INSERT INTO notes VALUES ((?), (?), (?), (?), (?), (?), (?), (?))', values, function (err) {
                if (err) {
                    console.error("Could not insert new note:")
                    console.error(err)
                    res.writeHead(500);
                } 
                else{
                	console.log(input.tag + " successfully added")
                	res.writeHead(200);
                }
                res.end();
            });
		})
	})
}

var key = 'aaaaaa';

function deleteNote(uri, res){
	console.log("IN DELETE");
	var input = qs.parse(uri.query);

	db.run("DELETE FROM notes WHERE key=(?) AND tag=(?)", [key, input.tag], function(err){
		if(err){
			console.error("ERROR Could not delete note:\n" + err);
			res.writeHead(500)
		}
		else{
			console.log(input.tag + " successfully deleted")
			res.writeHead(200)
		}
		res.end();
	})
}

function updateNote(req, res){
	console.log("RECEIVED UPDATE")
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () => {
		var input = JSON.parse(data);

		var arr = [input.newcontent, input.newx, input.newy, input.newW, input.newH, input.newZ, key, input.tag]

		db.serialize(() =>{
			db.run("UPDATE notes SET content=(?), x=(?), y=(?), width=(?), height=(?), zindex=(?) WHERE key=(?) AND tag=(?)", arr, function(err){
				if(err){
					console.error("ERROR could not update note" + input.tag + ":\n" + err);
					res.writeHead(500)
				}
				else{
					res.writeHead(200)
				}
				res.end();
			})
		})
	})
}


function getNotes(uri, res){
	var input = qs.parse(uri.query);
	var result = [];
	db.each("SELECT * FROM notes WHERE key=(?)", [key], function(error, row){
		result.push(row);
	}, function(){
		res.writeHead(200, {'Content-type': 'application/json'});
		res.end(JSON.stringify(result))
	})
}

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

