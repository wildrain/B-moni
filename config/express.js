/**
 * Module dependencies.
 */

var express = require('express')

  , mongoStore = require('connect-mongo')(express)
  , flash = require('connect-flash')
  , helpers = require('view-helpers')

module.exports = function (app,config,passport) {

  app.set('showStackError', true)
  // should be placed before express.static
  app.use(express.compress({
    filter: function (req, res) {
      return /json|text|javascript|css/.test(res.getHeader('Content-Type'));
    },
    level: 9
  }))
  app.use(express.favicon())
  app.use(express.static(config.root + '/public'))

  // don't use logger for test env
  
    app.use(express.logger('dev'))
  

  // set views path, template engine and default layout
  app.engine('.html', require('ejs').__express);
  app.set('views', config.root + '/app/views/')
  app.set('view engine', 'html')

  
  // enable jsonp
  app.enable("jsonp callback")
  app.enable('verbose errors')

  app.configure(function () {

       app.use(function(req, res, next) { 
      if(req.headers.host == 'blurbi.ca') { 
          res.redirect('http://www.blurbi.ca'+req.url);
      
      } 

      next();
    }) 

   

    app.use(require('connect-requestid'))
    // dynamic helpers
    app.use(helpers(config.app.name))

    // cookieParser should be above session
    app.use(express.cookieParser())

    // bodyParser should be above methodOverride
    app.use(express.bodyParser())
    app.use(express.methodOverride())

    // express/mongo session storage
    app.use(express.session({
      secret: 'podhop',
      store: new mongoStore({
        url: config.db,
        collection : 'sessions'
      })
    }))

    // connect flash for flash messages
    app.use(flash())

    // use passport session
    app.use(passport.initialize())
    app.use(passport.session())




    

   
    
    // routes should be at the last
    app.use(app.router)


  


    app.use(function(req, res, next){
      res.status(404).render('404error', { url: req.originalUrl, error: 'Not found' })
    })



    app.use(function(err, req, res, next){

      
      res.status(err.status || 500);
      res.render('error', { error: err });


    });


  
  })
}
