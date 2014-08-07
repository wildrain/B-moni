/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
async = require('async'),
generatePassword = require('password-generator'),
  //, _ = require('underscore')
mongoose=require("mongoose"),
DBConnection=require("../models/DBConnection"),
conns=DBConnection.GET_CONNECTIONS(),
blurbiCon=conns.blurbiDBConnection,
User = blurbiCon.model('User'),
blurbiBotCon=conns.blurbiBotDBConnection,
usersBot=blurbiBotCon.model('usersbot');
exports.render = function(req, res){
	 User.findOne({'email':'helloblurbi@blurbi.ca'}).exec(function(err,user){
        if(user){
        }
        else{
           var user=new User({'email' : 'helloblurbi@blurbi.ca'});
           var pass="hello1234";
            user.setPassword(pass);
            user.userType="admin";
            user.save(function(err){
            	if(err)
            		console.log(err);
            	else
            		console.log("admin created");
            })
        }
      })
 	if(req.user==null)
 	{
     	res.render('index', {
     	title: "blurbi",
        user: req.user ? req.user : "null",
        message: req.flash('error')
      })
   }
   else
   {
      req.user.lastLogin = new Date().toDateString();
      req.user.save(function(err){
          if(err)
              console.log(err);
      })
      //req.session.brandIndex = null;
      req.session.writer_name = null;
      req.session.writer_email = null;
      // req.session.brandIndex = null;
      if(req.user.userType!='agency'){
        req.session.brandIndex = null;

      }
      res.redirect('/users/home')
  } 
}
