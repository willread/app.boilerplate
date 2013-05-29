var config = require("./config");

var express = require("express");
var http = require("http");
var path = require("path");
var fs = require("fs");
var sys = require("sys")
var cluster = require("cluster");
var redis = require("redis");
var RedisStore = require("connect-redis")(express);
	
// Initialize app
	
var app = express();

// Setup redis

var redisClient = redis.createClient();

redisClient.on("error", function (err) {
    console.log("Redis error: " + err);
});

// App configuration

app.configure(function(){
	app.set("port", process.env.PORT || config.port);
	app.set("views", __dirname + "/views");
	app.set("view engine", "jade");
	
	// Misc helpers
	
	app.use(function(req, res, next){
		res.locals.config = config;
		res.locals.date = new Date();
		next();
	});
	
	app.use(express.cookieParser());
	app.use(express.session({
		secret: config.secret,
		store: new RedisStore({})
	}));
	app.use(require("less-middleware")({ src: __dirname + "/public" }));
	app.use(express.static(path.join(__dirname, "public")));
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
});

app.configure("development", function(){
	app.use(express.errorHandler());
});

// Routes

app.get("/", function(req, res){
	res.render("index");
});

// Start the server!
 
var cpus = require("os").cpus().length;

if(cluster.isMaster){

	// Fork
	
	for(var ii = 0; ii <cpus; ii++){
		cluster.fork();
	}
	
	cluster.on("exit", function(worker, code, signal){
		console.log("worker " + worker.process.pid + " died");
		cluster.fork(); // Restart
	});
	
	cluster.on("online", function(worker){
		console.log("worker " + worker.process.pid + " online");
	});

}else{

	http.createServer(app).listen(app.get('port'), function(){
		console.log("Express server listening on port " + app.get('port'));
	});	

}

