
var path = require('path')
  , rootPath = path.normalize(__dirname + '/..');

//var server_url = "https://beta.blurbi.ca/";
  var server_url = "https://www.blurbi.ca/";

module.exports = {
  development: {
    db: 'mongodb://localhost/blurbi',
    root: rootPath,
    app: {
      name: 'blurbi'
    },
    facebook: {
     clientID: "366830853419313",
     clientSecret: "215cb3e51aed7e9b64a81231a69763e4",
     callbackURL: "https://localhost/auth/facebook/callback"
   },
   twitter: {
     clientID: "Z1p3Lke2sMVtRlDoskQ",
     clientSecret: "rKqgpcz1f7unDfe1dDkLIiVcybwFruF5MRpW3Ewhg",
     callbackURL: "https://localhost/auth/twitter/callback"
   },
   bufferapp: {
     clientID: "5232ac81d03f12017700000a",
     clientSecret: "3279fc3b5755fef7e9d35fe12785e932",
     callbackURL: "https://localhost/auth/bufferapp/callback"
   },
   linkedin: {
      clientID: "h218eb9b9jbe",
      clientSecret: "mbEblpDjyKDUJFiR",
      callbackURL: "https://localhost/auth/linkedin/callback"
    }
    
  },

    production: {
    db: 'mongodb://localhost/blurbi',
    root: rootPath,
    app: {
      name: 'blurbi'
    },
    facebook: {
     clientID: "179665188868314",
     clientSecret: "8e14317608279572e9085296e5b202a4",
     callbackURL: server_url + "auth/facebook/callback"
   },
     twitter: {
      clientID: "tArZBZJxt4QmGuh1ikHNaQ",
     clientSecret: "G52wkLQN13wfiNqZpXZIeRQfo2rBcIoOii7sst7quU",
     callbackURL:  server_url + "auth/twitter/callback"
   },
   bufferapp: {
     clientID: "52bf951c9db8220244000044",
     clientSecret: "ea1a1805dc710fc0c6bc3118fcd7e5e7",
     callbackURL:  server_url + "auth/bufferapp/callback"
   },
   linkedin: {
      clientID: "77pfuo6mjpbdhc",
      clientSecret: "uLbGdtwzUQrLMxJi",
      callbackURL:  server_url + "auth/linkedin/callback"
    },
    
  }

  
}