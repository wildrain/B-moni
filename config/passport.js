var mongoose=require("mongoose"),
DBConnection=require("../app/models/DBConnection");
conns=DBConnection.GET_CONNECTIONS();
blurbiCon=conns.blurbiDBConnection;
User = blurbiCon.model('User'),
blurbiBotCon=conns.blurbiBotDBConnection,
usersBot=blurbiBotCon.model('usersbot'),

LocalStrategy = require('passport-local').Strategy,
TwitterStrategy = require('passport-twitter').Strategy,
FacebookStrategy = require('passport-facebook').Strategy,
BufferAppStrategy = require('passport-bufferapp').Strategy,
LinkedinStrategy= require('passport-linkedin-oauth2').Strategy;
config = require('../config/config');


module.exports = function (passport, config) {
    // require('./initializer')

    // serialize sessions


    passport.serializeUser(function(user, done) {
        done(null, user.id)
    })

    passport.deserializeUser(function(id, done) {
        User.findOne({
            _id: id
        }, function (err, user) {
            done(err, user)
        })
    //done(null,id)
    })

    // use local strategy
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {

        User.findOne({
            'email': email
        }, function (err, user) {
            if (err) {
                return done(err)
            }
            if (!user) {

                return done(null, false, {
                    message: 'Unknown user'
                })
            }
            if (!user.isValidPassword(password)) {
          
                return done(null, false, {
                    message: 'Invalid password'
                })
            }
            user.valid = true;
            user.lastLogin = new Date().toDateString();
            user.save(function(err){
                if(err)
                    console.log(err);
            })
            return done(null, user)
        })
    }
    ))


    passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID
        , 
        clientSecret: config.facebook.clientSecret
        , 
        callbackURL: config.facebook.callbackURL
        , 
        passReqToCallback: true
    },
    function(req,accessToken, refreshToken, profile, done) {

        console.log("PROFILE: "+profile._json);
    


            if(req.session.brandIndex){
                console.log('session variable is still stored');

                var brandIndex = req.session.brandIndex;
                console.log(brandIndex);

                User.findOne({
                    '_id':brandIndex
                }).exec(function(err,user){
                    if(!err && user){
                        user.facebook=profile._json;
                        user.facebookAccessToken=accessToken;
                        req.session.auth_type='facebook';
                        user.save(function (err) {
                            if (err) console.log(err)
                    
                        })
                        return done(err);
                    }



                })

            }
            else{
                req.user.facebook=profile._json;
                req.user.facebookAccessToken=accessToken;
    
                req.session.auth_type = 'facebook';
                req.user.save(function (err) {
                    if(err){
                       // console.log("PASSPORT.JS 273: DATA NOT SAVED"+err);
                    }else{
                      //  console.log("PASSPORT.JS 275: DATA SAVED");
                    }
              
                })
          


                return done(null,req.user,{
                    message: 'connected'
                })
            }

       
     
        }))

    passport.use(new TwitterStrategy({
        consumerKey: config.twitter.clientID
        , 
        consumerSecret: config.twitter.clientSecret
        , 
        callbackURL: config.twitter.callbackURL
        , 
        passReqToCallback: true
    },
    function(req,token, tokenSecret, profile, done) {
 
            if(req.session.brandIndex){

                var brandIndex = req.session.brandIndex;

                User.findOne({
                    '_id':brandIndex
                }).exec(function(err,user){
                    console.log(user);
                    user.twitter=profile._json;
                    user.twitterAccessToken=token;
                    user.twitterAccessTokenSecret=tokenSecret;

                    user.save(function (err) {
                        if (err) console.log(err)
                  
                    })
                    return done(null,req.user)



                })

            }
            else{

                req.user.twitter=profile._json;
                req.user.twitterAccessToken=token;
                req.user.twitterAccessTokenSecret=tokenSecret;
                req.session.auth_type = 'twitter';
            
                req.user.save(function (err) {
                    if(err){
                        console.log("PASSPORT.JS: 496"+err);
                    }else{
                        console.log("PASSPORT.JS 498 : DATA SAVED");
                    }
                  
                })

 
                return done(null,req.user);

            }  
      
    
        }))

  



    passport.use(new LinkedinStrategy({
        clientID: config.linkedin.clientID
        , 
        clientSecret: config.linkedin.clientSecret
        , 
        callbackURL: config.linkedin.callbackURL
        , 
        profileFields:['id','first-name','last-name','public-profile-url','email-address','phone-numbers','formatted-name']
        , 
        passReqToCallback: true
    },
    function(req, token, refreshToken, profile, done) {

        if(!req.user){
            User.findOne({
                linkedinId: profile.id
            }, function (err, user) {

                });

        }
        else{
            // console.log(profile);

            if(req.session.brandIndex){
                //  console.log("djfkdjf");
                var brandIndex = req.session.brandIndex;
                User.findOne({
                    '_id' : brandIndex
                }).exec(function(err,user){
                    user.linkedin=profile._json;
                    user.linkedinAccessToken= token;
                    user.linkedinRefreshToken= refreshToken; 
                    req.session.auth_type='linkedin';      
            
                    user.save(function (err) {
                        if (err) console.log(err)
                  
                    })
                    return done(null,req.user)

                })

            }
            else{
                req.user.linkedin=profile._json;
                req.user.linkedinAccessToken=token;
                req.user.linkedinRefreshToken=refreshToken;
                req.session.auth_type = 'linkedin';       
            
                req.user.save(function (err) {
                    if (err) 
                        console.log("PASSPORT.JS 661: DATA NOT SAVED"+err);
                    else
                        console.log("PASSPORT.JS 663: DATA SAVED");
                        return done(null,req.user)
                  
                })

            
        
            }
        }
   
    }
    ));
}
