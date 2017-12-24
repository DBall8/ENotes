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
			console.log("Hello")
			switch(req.method){
				case 'POST':
					addNote(req);
					break;
				case 'GET':
					getNotes(uri, res);
					break;
				default:
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


function addNote(req){
	var data = '';
	req.on('data', (d) => data += d);
	req.on('end', () => {
		console.log(data);

		var input = url.parse(data);

		var insert = '';
		insert += input.content + ', '
		insert += input.x + ', '
		insert += input.y + ', '
		insert += input.width + ', '
		insert += input.height + ', '
		insert += input.selected + ', '
		insert += input.zindex;
 
		db.serialize(function(){
			db.run('INSERT INTO notes VALUES (' + insert + ')');
		})
	})
}

function getNotes(uri, res){
	console.log("HELLO")
	var input = qs.parse(uri.query);
	var result = [];
	db.each("SELECT * FROM notes WHERE key=(?)", [input.key], function(error, row){
		result.push(row);
	}, function(){
		res.writeHead(200, {'Content-type': 'application/json', 'Access-Controll-Allow-Origin': 'http://localhost:3000'});
		res.end(JSON.stringify(result))

		console.log("SENDING:")
		console.log(JSON.stringify(result));
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

