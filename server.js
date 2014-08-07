
/**
 * Module dependencies.
 */

var express = require('express'),
fs = require('fs'),
passport=require('passport'),
logger = require('mean-logger'),
http = require('http'),
https= require('https'),
path = require('path'),
httpApp = express(),
httpApps = express(),
app = express();

var env = process.env.NODE_ENV || 'production',
config = require('./config/config')[env],
auth = require('./config/middlewares/authorization'),
mongoose = require('mongoose'),
DBConnection = require('./app/models/DBConnection');


DBConnection.CREATE_CONNECTIONS();

//var db = mongoose.connect(config.db);

/*var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
  require(models_path+'/'+file)
})*/

require('./config/passport')(passport, config)

var app = express();
require('./config/express')(app,config,passport)
require('./config/routes')(app,passport,auth)


var options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
};

httpApp.set('port', process.env.PORT || 80);
httpApp.get("*", function (req, res, next) {
    res.redirect("https://"  + req.headers.host + req.path);
});

app.set('port', process.env.PORT || 443);


http.createServer(httpApp).listen(httpApp.get('port'), function() {
    console.log('Express HTTP server listening on port ' + httpApp.get('port'));
});
 
https.createServer(options, app).listen(app.get('port'), function() {
    console.log('Express HTTPS server listening on port ' + app.get('port'));
});

logger.init(app, passport, mongoose)
exports = module.exports = app