var request = require('request'),
fs = require('fs'),
FormData = require('form-data'), //Pretty multipart form maker.
https = require('https'),
_ = require('underscore'),
mongoose=require("mongoose"),
DBConnection=require("../models/DBConnection"),
conns=DBConnection.GET_CONNECTIONS(),
blurbiCon=conns.blurbiDBConnection,
User = blurbiCon.model('User'),
blurbiBotCon=conns.blurbiBotDBConnection,
usersBot=blurbiBotCon.model('usersbot'),
promo = require("../../config/promo");
var env = process.env.NODE_ENV || 'production'
, config = require('../../config/config')[env];
var discounts = promo.promoCode();
exports.postMessage = function(req, res) {


    if(req.body.shareMessage){
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
                if(!err && user){
                    url = 'https://api.twitter.com/1.1/statuses/update.json';
                    var params = {
                        consumer_key: config.twitter.clientID,
                        consumer_secret: config.twitter.clientSecret,
                        token: user.twitterAccessToken,
                        token_secret: user.twitterAccessTokenSecret
                    };
                    var r = request.post({
                        url:url, 
                        oauth:params
                    }, function(error, response, body) {
                        if (error) {
                            console.log("Error occured: "+ error);
                            res.end('error occured');
                        } else {
                            res.send('sent');
                        }
                    });
                    var obj = req.body.shareMessage;
                    var form = r.form();
                    form.append('status', obj);

                }
                
                //console.log(obj.description);
            })
        }
        else{
            url = 'https://api.twitter.com/1.1/statuses/update.json';
            var params = {
                consumer_key: config.twitter.clientID,
                consumer_secret: config.twitter.clientSecret,
                token: req.user.twitterAccessToken,
                token_secret: req.user.twitterAccessTokenSecret
            };
            var r = request.post({
                url:url, 
                oauth:params
            }, function(error, response, body) {
                if (error) {
                    console.log("Error occured: "+ error);
                    res.end('error occured');
                } else {
                    res.send('sent');
                }
            });
            var obj =  req.body.shareMessage;
            var form = r.form();
            form.append('status', obj);
            
        }
    }
    else if(req.body.message){
        var blurbId = req.body.blurbId;
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
                url = 'https://api.twitter.com/1.1/statuses/update.json';
                var id=req.body.id;
                var params = {
                    consumer_key: config.twitter.clientID,
                    consumer_secret: config.twitter.clientSecret,
                    token: user.twitterAccessToken,
                    token_secret: user.twitterAccessTokenSecret
                };
                var r = request.post({
                    url:url, 
                    oauth:params
                }, function(error, response, body) {
                    if (error) {
                        console.log("Error occured: "+ error);
                        res.end('error occured');
                    } else {
                        res.send('sent');
                        var twitterPostId=body.id_str;
                        if(blurbId){
                            var blurb = _.filter(user.brand.historyWriteBlurb,function(item){return item._id == blurbId});
                            if(blurb.length > 0){
                                blurb[0].twitterPostId = twitterPostId;    //saving post id
                                blurb[0].twitterAccessToken=user.twitterAccessToken;
                                blurb[0].twitterAccessTokenSecret=user.twitterAccessTokenSecret;
                                user.save(function(err){
                                    if(err)
                                        console.log(err);
                                })
                            }
                        }
                    }
                });
                var obj = req.body.message;
                var form = r.form();
                form.append('status', obj);
                var body = JSON.parse(body);
                
                //console.log(obj.description);
            })
        }
        else{
            url = 'https://api.twitter.com/1.1/statuses/update.json';
            var params = {
                consumer_key: config.twitter.clientID,
                consumer_secret: config.twitter.clientSecret,
                token: req.user.twitterAccessToken,
                token_secret: req.user.twitterAccessTokenSecret
            };
            var r = request.post({
                url:url, 
                oauth:params
            }, function(error, response, body) {
                if (error) {
                    console.log("Error occured: "+ error);
                    res.end('error occured');
                } else {
                    res.send('sent');
                    var body = JSON.parse(body);
                    // console.log(body);
                    var twitterPostId=body.id_str;
                    if(blurbId){
                        var blurb = _.filter(req.user.brand.historyWriteBlurb,function(item){return item._id == blurbId});
                        if(blurb.length > 0){
                            //console.log(blurb);
                            blurb[0].twitterPostId = twitterPostId;    //saving post id
                            blurb[0].twitterAccessToken=req.user.twitterAccessToken;
                            blurb[0].twitterAccessTokenSecret=req.user.twitterAccessTokenSecret;
                           // console.log(blurb[0]);
                            req.user.save(function(err){
                                if(err)
                                    console.log(err);
                            })
                        }
                    }
                }
            });
            var obj =  req.body.message;
            var form = r.form();
            form.append('status', obj);
            //console.log(obj.description);
            
        }
    }
    else{
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
              
                var id=req.body.id;
                // if(!user.brand.historyWriteBlurb[id].imagePath)
                url = 'https://api.twitter.com/1.1/statuses/update.json';
                // else
                //     url='https://api.twitter.com/1.1/statuses/update_with_media.json'; 
                var params = {
                    consumer_key: config.twitter.clientID,
                    consumer_secret: config.twitter.clientSecret,
                    token: user.twitterAccessToken,
                    token_secret: user.twitterAccessTokenSecret
                };
                var r = request.post({
                    url:url, 
                    oauth:params
                }, function(error, response, body) {
                    if (error) {
                        console.log("Error occured: "+ error);
                        res.end('error occured');
                    } else {
                        res.send('sent');
                        var writerId=user.brand.historyWriteBlurb[id].id;
                        var writerIndex=user.brand.historyWriteBlurb[id].writerIndex;
                        //console.log('writer indexing '+writer_index);
                        var blurbId = user.brand.historyWriteBlurb[id]._id;
                        if(user.brand.historyWriteBlurb[id].id!=null){
                              payment.payForPost(user._id,writerId,blurbId);
                        } 
                    }
                });
                var obj =  user.brand.historyWriteBlurb[id];
                var form = r.form();
                form.append('status', obj.description);
             
            })
        }
        else{
            // console.log("ELSE OF 2ND AGENCY");
            // url = 'https://api.twitter.com/1.1/statuses/update.json';
            var id=req.body.id;
            // if(!req.user.brand.historyWriteBlurb[id].imagepath)
                url = 'https://api.twitter.com/1.1/statuses/update.json';
            // else
            //     url='https://api.twitter.com/1.1/statuses/update_with_media.json'; 

            var params = {
                consumer_key: config.twitter.clientID,
                consumer_secret: config.twitter.clientSecret,
                token: req.user.twitterAccessToken,
                token_secret: req.user.twitterAccessTokenSecret
            };
            var r = request.post({
                url:url, 
                oauth:params
            }, function(error, response, body) {
                if (error) 
                {
                    console.log("Error occured: "+ error);
                    res.end('error occured');
                } 
                else 
                {
                    res.send('sent');
                    var writerId=req.user.brand.historyWriteBlurb[id].id;
                    var writerIndex=req.user.brand.historyWriteBlurb[id].writerIndex;
                    var body = JSON.parse(body);
                    console.log(body.id_str);
                    var twitterPostId=body.id_str;
                    req.user.brand.historyWriteBlurb[id].twitterPostId = twitterPostId;    //saving post id
                    req.user.brand.historyWriteBlurb[id].twitterAccessToken=req.user.twitterAccessToken;
                    req.user.brand.historyWriteBlurb[id].twitterAccessTokenSecret=req.user.twitterAccessTokenSecret;
                    req.user.brand.historyWriteBlurb[id].postingLastDate = new Date();
                    console.log("TWITTER POST ID"+body.id_str);
                    // req.user.brand.historyWriteBlurb[id].status='Accepted';
                    req.user.save(function(err){
                        if(err)
                        {
                            console.log(err);
                        }
                    })
                    var blurbId = req.user.brand.historyWriteBlurb[id]._id;
                    if(req.user.brand.historyWriteBlurb[id].id!=null){
                          payment.payForPost(req.user._id,writerId,blurbId);
                    } 
                }
            });
            var obj =  req.user.brand.historyWriteBlurb[id];
            var form = r.form();
            form.append('status', obj.description);
           
        }
    }
}

exports.postImage = function(req, res) {
    url = 'https://api.twitter.com/1.1/statuses/update_with_media.json';
    var params = {
        consumer_key: config.twitter.clientID,
        consumer_secret: config.twitter.clientSecret,
        token: req.user.twitter_access_token,
        token_secret: req.user.twitter_access_token_secret
    };
    var r = request.post({
        url:url, 
        oauth:params
    }, function(error, response, body) {
        if (error) {
            console.log("Error occured: "+ error);
            res.end('error occured');
        } else {
            res.send('sent');
        }
    });
    var form = r.form();
    form.append('status', req.body.message);
    form.append('media[]', fs.createReadStream(req.files.picture.path));
}
