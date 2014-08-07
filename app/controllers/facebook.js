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
payment = require('./payment');
var discounts = promo.promoCode();
exports.getInfo = function(req,res){
    
    var pages;
    var url = 'https://graph.facebook.com/me/accounts';
    if(req.user.userType=='brand'){
        var accessToken = req.user.facebookAccessToken;
        var params = {
            access_token: accessToken,
        };
        request.get({  url: url, qs: params}, function(err, resp, pages) {
           // console.log(resp);
            pages = JSON.parse(pages);
            // console.log(pages);
            var url = 'https://graph.facebook.com/me/groups';
            var accessToken = req.user.facebookAccessToken;
            var params = {
                access_token: accessToken,
            };
            request.get({  url: url, qs: params}, function(err, resp, groups) {
               // console.log(resp);
               var groups = JSON.parse(groups);
               // console.log(groups);
               res.send({groups: groups.data, pages: pages.data});
            })
        })

    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({'_id': brandIndex}).exec(function(err,user){
            if(!err && user){
                var accessToken = user.facebookAccessToken;
                var params = {
                    access_token: accessToken,
                };
                request.get({  url: url, qs: params}, function(err, resp, pages) {
                   // console.log(resp);
                    pages = JSON.parse(pages);
                    // console.log(pages);
                    var url = 'https://graph.facebook.com/me/groups';
                    var accessToken = user.facebookAccessToken;
                    var params = {
                        access_token: accessToken,
                    };
                    request.get({  url: url, qs: params}, function(err, resp, groups) {
                       // console.log(resp);
                       var groups = JSON.parse(groups);
                       // console.log(groups);
                       res.send({groups: groups.data, pages: pages.data});
                    })
                })

            }
        })
    }
    
   
}
exports.postMessage = function(req,res) {
    // Specify the URL and query string parameters needed for the request
    //console.log("djfkjsdk");
    console.log('comes in posted');
    console.log(req.body);
    if(req.body.shareMessage){
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({'_id' : brandIndex}).exec(function(err,user){
                if(!err && user){
                    var accessToken;
                    if(user.facebookPostPageType=='page'){
                        accessToken = user.facebookPageInfo.access_token;
                    }
                    else{
                        accessToken = user.facebookAccessToken;
                    }
                    var message = req.body.shareMessage + '\n';
                    message += "website link: https://www.blurbi.ca\n";
                    message += "promoCode: " + user.promoCode;
                    if(user.facebookPostPageType=='profile'){
                        url = 'https://graph.facebook.com/me/feed';
                    }
                    else if(user.facebookPostPageType=='group'){
                         url = 'https://graph.facebook.com/' + user.facebookGroupInfo.id + '/feed';
                         console.log(url);
                    }
                    else if(user.facebookPostPageType=='page'){
                         url = 'https://graph.facebook.com/' + user.facebookPageInfo.id + '/feed';
                         console.log(url);
                    }
                    var params = {
                        access_token: accessToken,
                        link: 'https://www.blurbi.ca',
                        message: message
                    };
                    request.post({
                            url: url, 
                            qs: params
                        }, function(err, resp, body) {
                            // Handle any errors that occur
                            if (err){
                                console.error("Error occured: ", err);
                                res.end('Error');
                                return ;
                            } 
                            body = JSON.parse(body);
                            if (body.error){
                                res.end('error occoured');
                                return console.error("Error returned from facebook: ", body.error);
                            }
                            res.end('sent');
                    })


                }
            })

        }
        else{

            var accessToken;
            if(req.user.facebookPostPageType=='page'){
                accessToken = req.user.facebookPageInfo.access_token;
            }
            else{
                accessToken = req.user.facebookAccessToken;
            }
            var message = req.body.shareMessage + '\n';
            message += "website link: https://www.blurbi.ca\n";
            message += "promoCode: " + req.user.promoCode;
            // console.log('message');
            // console.log(message);
            if(req.user.facebookPostPageType=='profile'){
                url = 'https://graph.facebook.com/me/feed';
            }
            else if(req.user.facebookPostPageType=='group'){
                 url = 'https://graph.facebook.com/' + req.user.facebookGroupInfo.id + '/feed';
                 console.log(url);
            }
            else if(req.user.facebookPostPageType=='page'){
                 url = 'https://graph.facebook.com/' + req.user.facebookPageInfo.id + '/feed';
                 console.log(url);
            }
            var params = {
                access_token: accessToken,
                link: 'https://www.blurbi.ca',
                message: message
            };
            request.post({
                    url: url, 
                    qs: params
                }, function(err, resp, body) {
                    // Handle any errors that occur
                    if (err){
                        console.error("Error occured: ", err);
                        res.end('Error');
                        return ;
                    } 
                    body = JSON.parse(body);
                    if (body.error){
                        res.end('error occoured');
                        return console.error("Error returned from facebook: ", body.error);
                    }
                    res.end('sent');
            })
            
                    

        }
    }
    else if(req.body.message){
        var blurbId = req.body.blurbId;
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
                var accessToken;
                if(user.facebookPostPageType=='page'){
                    accessToken = user.facebookPageInfo.access_token;
                }
                else{
                    accessToken = user.facebookAccessToken;
                }
                var message = req.body.message;
                var link_string = req.body.message.replace( /\n/g, " " ).split(" ");
                var reg_url = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ;
                var link;
                for(var i=0;i<link_string.length;i++){
                    if(reg_url.test(link_string[i]))
                    {
                        link = link_string[i];
                        break;
                    }
                }
                if(link){
                    link = link.trim();
                }
                var url;
                if(user.facebookPostPageType=='profile'){
                    url = 'https://graph.facebook.com/me/feed';
                }
                else if(user.facebookPostPageType=='group'){
                     url = 'https://graph.facebook.com/' + user.facebookGroupInfo.id + '/feed';
                     console.log(url);
                }
                else if(user.facebookPostPageType=='page'){
                     url = 'https://graph.facebook.com/' + user.facebookPageInfo.id + '/feed';
                     console.log(url);
                }
                var params = {
                    access_token: accessToken,
                    link: link,
                    message: message
                };
                // Send the request
                request.post({
                    url: url, 
                    qs: params
                }, function(err, resp, body) {
                    // Handle any errors that occur
                    if (err){
                        console.error("Error occured: ", err);
                        res.end('Error');
                        return ;
                    } 
                    body = JSON.parse(body);
                    if (body.error){
                        res.end('error occoured');
                        return console.error("Error returned from facebook: ", body.error);
                    }
                    // Generate output
                    console.log("here");
                    var output = '<p>Message has been posted to your feed. Here is the id generated:</p>';
                    output += '<pre>' + JSON.stringify(body, null, '\t') + '</pre>';
                    //var out = JSON.stringify(body, null, '\t');
                    var facebookPostId = body.id;
                    //user.brand[brandIndex].facebookPostId=postId;

                    res.end('sent');
                    if(blurbId){
                        var blurb = _.filter(user.brand.historyWriteBlurb,function(item){return item._id == blurbId});
                        if(blurb.length > 0){
                            blurb[0].facebookPostId = postId;
                            blurb[0].facebookAccessToken=accessToken;
                            user.save(function(err){
                                if(err)
                                    console.log(err);
                            })
                        }
                    }
                });
            })
        }
        else{
            var accessToken;
            if(req.user.facebookPostPageType=='page'){
                accessToken = req.user.facebookPageInfo.access_token;
            }
            else{
                accessToken = req.user.facebookAccessToken;
            }
            var id = req.body.id;
            var message = req.body.message;
            var url;
            console.log(req.user.facebookPostPageType);
            if(req.user.facebookPostPageType=='profile'){
                url = 'https://graph.facebook.com/me/feed';
            }
            else if(req.user.facebookPostPageType=='group'){
                 url = 'https://graph.facebook.com/' + req.user.facebookGroupInfo.id + '/feed';
                 console.log(url);
            }
            else if(req.user.facebookPostPageType=='page'){
                 url = 'https://graph.facebook.com/' + req.user.facebookPageInfo.id + '/feed';
                 console.log(url);
            }
            var link_string = message.replace( /\n/g, " " ).split(" ");
            var reg_url = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ;
            var link;
            for(var i=0;i<link_string.length;i++){
                if(reg_url.test(link_string[i]))
                {
                    link = link_string[i];
                    break;
                }
            }
            if(link){
                link = link.trim();
            }
            var params = {
                access_token: accessToken,
                link: link,
                message: message
            };
            // Send the request
            request.post({
                url: url, 
                qs: params
            }, function(err, resp, body) {
                // Handle any errors that occur
                if (err){
                    console.error("Error occured: ", err);
                    res.end('Error');
                    return ;
                } 
                body = JSON.parse(body);
                if (body.error){
                    res.end('error occoured');
                    return console.error("Error returned from facebook: ", body.error);
                }
                // Generate output
                console.log("here");
                var output = '<p>Message has been posted to your feed. Here is the id generated:</p>';
                output += '<pre>' + JSON.stringify(body, null, '\t') + '</pre>';
                //var out = JSON.stringify(body, null, '\t');
                var facebookPostId = body.id;
                res.end('sent');
                if(blurbId){
                    var blurb = _.filter(req.user.brand.historyWriteBlurb,function(item){return item._id == blurbId});
                    if(blurb.length > 0){
                        blurb[0].facebookPostId = facebookPostId;
                        blurb[0].facebookAccessToken=accessToken;
                        req.user.save(function(err){
                            if(err)
                                console.log(err);
                        })
                    }
                }
            });
        }
    }
    // if not message
    else{
        if(req.user.userType=='agency'){
            console.log('here comes');
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
                var accessToken;
                if(user.facebookPostPageType=='page'){
                    accessToken = user.facebookPageInfo.access_token;
                }
                else{
                    accessToken = user.facebookAccessToken;
                }
                var id = req.body.id;
                var message = user.brand.historyWriteBlurb[id].description;
                var link_string = user.brand.historyWriteBlurb[id].description.replace( /\n/g, " " ).split(" ");
                var reg_url = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ;
                var link;
                var picture;
                if(user.brand.historyWriteBlurb[id].selected_thumbnail){
                    picture = user.brand.historyWriteBlurb[id].selected_thumbnail; 
                }
                if(user.brand.historyWriteBlurb[id].imagePath){
                    picture= 'https://www.blurbi.ca/' + user.brand.historyWriteBlurb[id].imagePath;
                }
                for(var i=0;i<link_string.length;i++){
                    if(reg_url.test(link_string[i]))
                    {
                        link = link_string[i];
                        break;
                    }
                }
                if(link){
                    link = link.trim();
                }
                var url;
                if(user.facebookPostPageType=='profile'){
                    url = 'https://graph.facebook.com/me/feed';
                }
                else if(user.facebookPostPageType=='group'){
                     url = 'https://graph.facebook.com/' + user.facebookGroupInfo.id + '/feed';
                     console.log(url);
                }
                else if(user.facebookPostPageType=='page'){
                     url = 'https://graph.facebook.com/' + user.facebookPageInfo.id + '/feed';
                     console.log(url);
                }
                var params;
                if(user.brand.historyWriteBlurb[id].linkInfo && user.facebookPostPageType=='page'){
                    params = {
                        access_token: accessToken,
                        message: message,
                        picture: user.brand.historyWriteBlurb[id].linkInfo.thumbnail_url,
                        name: user.brand.historyWriteBlurb[id].linkInfo.title,
                        description: user.brand.historyWriteBlurb[id].description
                    };
                }
                else{
                    params = {
                        access_token: accessToken,
                        link: link,
                        message: message,
                        picture: picture
                    };
                }
                // Send the request
                request.post({
                    url: url, 
                    qs: params
                }, function(err, resp, body) {
                    // Handle any errors that occur
                    if (err){
                        console.error("Error occured: ", err);
                        res.end('Error');
                        return ;
                    } 
                    body = JSON.parse(body);
                    if (body.error){
                        res.end('error occoured');
                        return console.error("Error returned from facebook: ", body.error);
                    }
                    // Generate output
                    console.log("here");
                    var output = '<p>Message has been posted to your feed. Here is the id generated:</p>';
                    output += '<pre>' + JSON.stringify(body, null, '\t') + '</pre>';
                    //var out = JSON.stringify(body, null, '\t');
                    var facebookPostId = body.id;
                    res.end('sent');
                    var writerId=user.brand.historyWriteBlurb[id].id;
                    var writerIndex=user.brand.historyWriteBlurb[id].writerIndex;
                    // user.brand.historyWriteBlurb[id].status='Accepted';
                    user.brand.historyWriteBlurb[id].facebookPostId=facebookPostId;
                    user.brand.historyWriteBlurb[id].facebookAccessToken=accessToken;
                    user.brand.historyWriteBlurb[id].postingLastDate = new Date();
                    user.save(function(err){
                        if(err)
                            console.log(err);
                    })
                    var blurbId = user.brand.historyWriteBlurb[id]._id;
                    if(user.brand.historyWriteBlurb[id].id!=null){
                          payment.payForPost(user._id,writerId,blurbId);
                    }
                  
                    
                });
            })
        }
        else{
            var accessToken;
            if(req.user.facebookPostPageType=='page'){
                accessToken = req.user.facebookPageInfo.access_token;
            }
            else{
                accessToken = req.user.facebookAccessToken;
            }
            var id = req.body.id;
            var message = req.user.brand.historyWriteBlurb[id].description;
            var url;
            if(req.user.facebookPostPageType=='profile'){
                url = 'https://graph.facebook.com/me/feed';
            }
            else if(req.user.facebookPostPageType=='group'){
                 url = 'https://graph.facebook.com/' + req.user.facebookGroupInfo.id + '/feed';
                 console.log(url);
            }
            else if(req.user.facebookPostPageType=='page'){
                 url = 'https://graph.facebook.com/' + req.user.facebookPageInfo.id + '/feed';
                 console.log(url);
            }
            var link_string = req.user.brand.historyWriteBlurb[id].description.replace( /\n/g, " " ).split(" ");
            var reg_url = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ;
            var link;
            var picture;
            if(req.user.brand.historyWriteBlurb[id].selected_thumbnail){
                picture= req.user.brand.historyWriteBlurb[id].selected_thumbnail;
            }
            if(req.user.brand.historyWriteBlurb[id].imagePath){
                picture= 'https://www.blurbi.ca/' + req.user.brand.historyWriteBlurb[id].imagePath;
            }
            for(var i=0;i<link_string.length;i++){
                if(reg_url.test(link_string[i]))
                {
                    link = link_string[i];
                    break;
                }
            }
            if(link){
                link = link.trim();
            }
            var params = {
                access_token: accessToken,
                link: link,
                message: message,
                picture: picture
            };
            // Send the request
            request.post({
                url: url, 
                qs: params
            }, function(err, resp, body) {
                // Handle any errors that occur
                if (err){
                    console.error("Error occured: ", err);
                    res.end('Error');
                    return ;
                } 
                body = JSON.parse(body);
                if (body.error){
                    res.end('error occoured');
                    return console.error("Error returned from facebook: ", body.error);
                }
                // Generate output
                console.log("here");
                var output = '<p>Message has been posted to your feed. Here is the id generated:</p>';
                output += '<pre>' + JSON.stringify(body, null, '\t') + '</pre>';
                //var out = JSON.stringify(body, null, '\t');
                var facebookPostId = body.id;
                res.end('sent');
                var writerId=req.user.brand.historyWriteBlurb[id].id;
                var writerIndex=req.user.brand.historyWriteBlurb[id].writerIndex;
                // req.user.brand.historyWriteBlurb[id].status='Accepted';
                console.log("FACEBOOK POST ID: "+facebookPostId);
                req.user.brand.historyWriteBlurb[id].facebookPostId=facebookPostId; //saving facebook  user.brand.historyWriteBlurb[id].postingLastDate = new Date();post id
                req.user.brand.historyWriteBlurb[id].facebookAccessToken=accessToken;
                req.user.brand.historyWriteBlurb[id].postingLastDate = new Date();
                req.user.save(function(err){
                    if(err)
                        console.log(err);
                })
                var blurbId = req.user.brand.historyWriteBlurb[id]._id;
                if(req.user.brand.historyWriteBlurb[id].id!=null){
                      payment.payForPost(req.user._id,writerId,blurbId);
                }
          
            });
        }
    }
}
