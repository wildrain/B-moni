/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var request = require('request'),
fs = require('fs'),
FormData = require('form-data'), //Pretty multipart form maker.
https = require('https'),
js2xmlparser = require("js2xmlparser"),
xml2jsparser = require("xml2js"),
parser = new xml2jsparser.Parser(),
_ = require('underscore'),
mongoose = require('mongoose'),
blurbiDB=require("../models/users"),
blurbiBotDB=require('../models/usersBot'),
blurbiCon=blurbiDB.GET_BLURBIDB_CONNECTION(),
User = blurbiCon.model('User'),
blurbiBotCon=blurbiBotDB.GET_BLURBIBOTDB_CONNECTION(),
usersBot=blurbiBotCon.model('usersbot'),
promo = require("../../config/promo");
var discounts = promo.promoCode();
exports.getInfo = function(req,res){
       
   var groups;
   if(req.user.userType=='brand'){
        var access_token = req.user.linkedinAccessToken;
        var url = 'https://api.linkedin.com/v1/people/~/group-memberships?membership-state=manager&membership-state=owner&format=json&oauth2_access_token='+ access_token;
        request.get({ url: url, json: true },function(err, groups){
            //console.log(groups.body.values);
            var url = 'https://api.linkedin.com/v1/companies?is-company-admin=true&format=json&oauth2_access_token='+ access_token;
            request.get({url: url, json: true}, function(err, companies){
                console.log(companies.body);
                res.send({groups: groups.body.values, 'companies': companies.body.values});
            })
        });

   }
   else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({'_id': brandIndex}).exec(function(err,user){
            if(!err && user){
                var access_token = user.linkedinAccessToken;
                var url = 'https://api.linkedin.com/v1/people/~/group-memberships?membership-state=manager&membership-state=owner&format=json&oauth2_access_token='+ access_token;
                request.get({ url: url, json: true },function(err, groups){
                    //console.log(groups.body.values);
                    var url = 'https://api.linkedin.com/v1/companies?is-company-admin=true&format=json&oauth2_access_token='+ access_token;
                    request.get({url: url, json: true}, function(err, companies){
                        console.log(companies.body);
                        res.send({groups: groups.body.values, 'companies': companies.body.values});
                    })
                });

            }
        })
   }
}
exports.postMessage = function(req,res){
    if(req.body.shareMessage){
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
                if(!err && user){
                    var access_token = user.linkedinAccessToken;
                    var message = req.body.shareMessage;
                    var url;
                    var post_data;
                    if(user.linkedinPostPageType=='profile'){
                        url = 'https://api.linkedin.com/v1/people/~/shares?format=json&oauth2_access_token='+ access_token;
                        post_data={
                            "comment": message,
                            "visibility": {
                                "code": "anyone"
                            }
                        }
                        //console.log(message);
                        //console.log(post_data);
                        post_data=js2xmlparser("share", post_data);
                        console.log(post_data);
                    }
                    else if(user.linkedinPostPageType=='group'){
                        url = 'https://api.linkedin.com/v1/groups/'+ user.linkedinGroupInfo.group.id + '/posts/?oauth2_access_token='+ access_token ;
                        console.log(url);
                        post_data={
                            "content": {'description': message, 'title': '', 'submitted-url': 'https://www.blurbi.ca', 'submitted-image-url': 'https://www.blurbi.ca'},
                            "title" : 'post',
                            "summary": ''
                        }
                        //console.log(message);
                        //console.log(post_data);
                        post_data=js2xmlparser("post", post_data);
                        console.log(post_data);
                    }
                    else if(user.linkedinPostPageType=='company'){
                        url = 'https://api.linkedin.com/v1/companies/'+ user.linkedinCompanyInfo.id + '/shares/?oauth2_access_token='+ access_token ;
                        console.log(url);
                        post_data={
                            "comment": message,
                            "visibility": {
                                "code": "anyone"
                            }
                        }
                        //console.log(message);
                        //console.log(post_data);
                        post_data=js2xmlparser("share", post_data);
                        console.log(post_data);
                    }
                    request.post({
                        url: url,
                        headers:{
                            'Content-Type': 'application/xml'
                        },
                        body: post_data
                    },function(err, resp){
                        console.log(post_data);
                        console.log(resp.body);
                        if(resp.errorCode)
                            res.send('error');
                        else
                            res.send('sent');
                      

                    });
                }
            })
        }
        else{
            var access_token = req.user.linkedinAccessToken;
            var message = req.body.shareMessage;
            var url;
            var post_data;
            if(req.user.linkedinPostPageType=='profile'){
                url = 'https://api.linkedin.com/v1/people/~/shares?format=json&oauth2_access_token='+ access_token;
                post_data={
                    "comment": message,
                    "visibility": {
                        "code": "anyone"
                    }
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("share", post_data);
                console.log(post_data);
            }
            else if(req.user.linkedinPostPageType=='group'){
                url = 'https://api.linkedin.com/v1/groups/'+ req.user.linkedinGroupInfo.group.id + '/posts/?oauth2_access_token='+ access_token ;
                console.log(url);
                post_data={
                    "content": {'description': message, 'title': '', 'submitted-url': 'https://www.blurbi.ca', 'submitted-image-url': 'https://www.blurbi.ca'},
                    "title" : 'post',
                    "summary": ''
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("post", post_data);
                console.log(post_data);
            }
            else if(req.user.linkedinPostPageType=='company'){
                url = 'https://api.linkedin.com/v1/companies/'+ req.user.linkedinCompanyInfo.id + '/shares/?oauth2_access_token='+ access_token ;
                console.log(url);
                post_data={
                    "comment": message,
                    "visibility": {
                        "code": "anyone"
                    }
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("share", post_data);
                console.log(post_data);
            }
            request.post({
                url: url,
                headers:{
                    'Content-Type': 'application/xml'
                },
                body: post_data
            },function(err, resp){
                console.log(post_data);
                console.log(resp.body);
                if(resp.errorCode)
                    res.send('error');
                else
                    res.send('sent');
               
            });
        }
    }
    else if(req.body.message){
        var blurbId = req.body.blurbId;
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
                var access_token = user.linkedinAccessToken;
                var message = req.body.message;
                var url;
                var post_data;
                if(user.linkedinPostPageType=='profile'){
                    url = 'https://api.linkedin.com/v1/people/~/shares?format=json&oauth2_access_token='+ access_token;
                    post_data={
                        "comment": message,
                        "visibility": {
                            "code": "anyone"
                        }
                    }
                    //console.log(message);
                    //console.log(post_data);
                    post_data=js2xmlparser("share", post_data);
                    console.log(post_data);
                }
                else if(user.linkedinPostPageType=='group'){
                    url = 'https://api.linkedin.com/v1/groups/'+ user.linkedinGroupInfo.group.id + '/posts/?oauth2_access_token='+ access_token ;
                    console.log(url);
                    post_data={
                        "content": {'description': message, 'title': '', 'submitted-url': 'https://www.blurbi.ca', 'submitted-image-url': 'https://www.blurbi.ca'},
                        "title" : 'post',
                        "summary": ''
                    }
                    //console.log(message);
                    //console.log(post_data);
                    post_data=js2xmlparser("post", post_data);
                    console.log(post_data);
                }
                else if(user.linkedinPostPageType=='company'){
                    url = 'https://api.linkedin.com/v1/companies/'+ user.linkedinCompanyInfo.id + '/shares/?oauth2_access_token='+ access_token ;
                    console.log(url);
                    post_data={
                        "comment": message,
                        "visibility": {
                            "code": "anyone"
                        }
                    }
                    //console.log(message);
                    //console.log(post_data);
                    post_data=js2xmlparser("share", post_data);
                    console.log(post_data);
                }
                request.post({
                    url: url,
                    headers:{
                        'Content-Type': 'application/xml'
                    },
                    body: post_data
                },function(err, resp){
                    console.log(post_data);
                    console.log(resp.body);
                    if(resp.errorCode)
                        res.send('error');
                    else
                        res.send('sent');
                    var body=JSON.parse(resp.body);
                    if(blurbId){
                        var blurb = _.filter(user.brand.historyWriteBlurb,function(item){return item._id == blurbId});
                        if(blurb.length > 0){
                            if(user.linkedinPostPageType!='group'){
                                var linkedinPostId=body.updateKey;
                                blurb[0].linkedinPostId=linkedinPostId;    //saving linked in post id
                                blurb[0].linkedinAccessToken=access_token;
                                user.save(function(err){
                                    if(err)
                                        console.log(err);
                                })
                            }
                        }
                    }
                  

                });
            })
        }
        else{
            var access_token = req.user.linkedinAccessToken;
            var message = req.body.message;
            var url;
            var post_data;
            if(req.user.linkedinPostPageType=='profile'){
                url = 'https://api.linkedin.com/v1/people/~/shares?format=json&oauth2_access_token='+ access_token;
                post_data={
                    "comment": message,
                    "visibility": {
                        "code": "anyone"
                    }
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("share", post_data);
                console.log(post_data);
            }
            else if(req.user.linkedinPostPageType=='group'){
                url = 'https://api.linkedin.com/v1/groups/'+ req.user.linkedinGroupInfo.group.id + '/posts/?oauth2_access_token='+ access_token ;
                console.log(url);
                post_data={
                    "content": {'description': message, 'title': '', 'submitted-url': 'https://www.blurbi.ca', 'submitted-image-url': 'https://www.blurbi.ca'},
                    "title" : 'post',
                    "summary": ''
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("post", post_data);
                console.log(post_data);
            }
            else if(req.user.linkedinPostPageType=='company'){
                url = 'https://api.linkedin.com/v1/companies/'+ req.user.linkedinCompanyInfo.id + '/shares/?oauth2_access_token='+ access_token ;
                console.log(url);
                post_data={
                    "comment": message,
                    "visibility": {
                        "code": "anyone"
                    }
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("share", post_data);
                console.log(post_data);
            }
            request.post({
                url: url,
                headers:{
                    'Content-Type': 'application/xml'
                },
                body: post_data
            },function(err, resp){
                console.log(post_data);
                console.log(resp.body);
                if(resp.errorCode)
                    res.send('error');
                else
                    res.send('sent');
                var body=JSON.parse(resp.body);
                if(blurbId){
                    var blurb = _.filter(req.user.brand.historyWriteBlurb,function(item){return item._id == blurbId});
                    if(blurb.length > 0){
                        if(req.user.linkedinPostPageType!='group'){
                            var linkedinPostId=body.updateKey;
                            blurb[0].linkedinPostId=linkedinPostId;    //saving linked in post id
                            blurb[0].linkedinAccessToken=access_token;
                            req.user.save(function(err){
                                if(err)
                                    console.log(err);
                            })
                        }
                    }
                }
            });
        }
    }
    else{
        var id = req.body.id;
        if(req.user.userType=='agency'){
            var brandIndex = req.session.brandIndex;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
                var access_token = user.linkedinAccessToken;
                var message = user.brand.historyWriteBlurb[id].description;
                var url;
                var post_data;
                if(user.linkedinPostPageType=='profile'){
                    url = 'https://api.linkedin.com/v1/people/~/shares?format=json&oauth2_access_token='+ access_token;
                    post_data={
                        "comment": message,
                        "visibility": {
                            "code": "anyone"
                        }
                    }
                    //console.log(message);
                    //console.log(post_data);
                    post_data=js2xmlparser("share", post_data);
                    console.log(post_data);
                }
                else if(user.linkedinPostPageType=='group'){
                    url = 'https://api.linkedin.com/v1/groups/'+ user.linkedinGroupInfo.group.id + '/posts/?oauth2_access_token='+ access_token ;
                    console.log(url);
                    post_data={
                        "content": {'description': message, 'title': '', 'submitted-url': 'https://www.blurbi.ca', 'submitted-image-url': 'https://www.blurbi.ca'},
                        "title" : 'post',
                        "summary": ''
                    }
                    //console.log(message);
                    //console.log(post_data);
                    post_data=js2xmlparser("post", post_data);
                    console.log(post_data);
                }
                else if(user.linkedinPostPageType=='company'){
                    url = 'https://api.linkedin.com/v1/companies/'+ user.linkedinCompanyInfo.id + '/shares/?format=json&oauth2_access_token='+ access_token ;
                    console.log(url);
                    post_data={
                        "comment": message,
                        "visibility": {
                            "code": "anyone"
                        }
                    }
                    //console.log(message);
                    //console.log(post_data);
                    post_data=js2xmlparser("share", post_data);
                    console.log(post_data);
                }
                request.post({
                    url: url, 
                    headers:{
                        'Content-Type': 'application/xml'
                    },
                    body: post_data
                },function(err, resp){
                    //var response_message = JSON.parse(resp);
                    //console.log(resp);
                    if(resp.errorCode){
                        res.send('error');
                    }else{
                        res.send('sent');
                    }
                    if(user.linkedinPostPageType!='group'){
                        var body=JSON.parse(resp.body);
                        var linkedinPostId=body.updateKey;
                        user.brand.historyWriteBlurb[id].linkedinPostId=linkedinPostId;    //saving linked in post id
                        user.brand.historyWriteBlurb[id].linkedinAccessToken=access_token;
                        user.brand.historyWriteBlurb[id].postingLastDate = new Date();

                    }
                    var writerId=user.brand.historyWriteBlurb[id].id;
                    var writerIndex=user.brand.historyWriteBlurb[id].writerIndex;
                    //console.log('writer indexing '+writer_index);
                    // user.brand.historyWriteBlurb[id].status='Accepted';
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
        }else{
            var access_token = req.user.linkedinAccessToken;
            var message = req.user.brand.historyWriteBlurb[id].description;
            var url;
            var post_data;
            if(req.user.linkedinPostPageType=='profile'){
                url = 'https://api.linkedin.com/v1/people/~/shares?format=json&oauth2_access_token='+ access_token;
                post_data={
                    "comment": message,
                    "visibility": {
                        "code": "anyone"
                    }
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("share", post_data);
                //console.log(post_data);
            }
            else if(req.user.linkedinPostPageType=='group'){
                url = 'https://api.linkedin.com/v1/groups/'+ req.user.linkedinGroupInfo.group.id + '/posts/?oauth2_access_token='+ access_token ;
                console.log(url);
                post_data={
                    "content": {'description': message, 'title': '', 'submitted-url': 'https://www.blurbi.ca', 'submitted-image-url': 'https://www.blurbi.ca'},
                    "title" : 'post',
                    "summary": ''
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("post", post_data);
                console.log(post_data);
            }
            else if(req.user.linkedinPostPageType=='company'){
                url = 'https://api.linkedin.com/v1/companies/'+ req.user.linkedinCompanyInfo.id + '/shares/?format=json&oauth2_access_token='+ access_token ;
                console.log(url);
                post_data={
                    "comment": message,
                    "visibility": {
                        "code": "anyone"
                    }
                }
                //console.log(message);
                //console.log(post_data);
                post_data=js2xmlparser("share", post_data);
                console.log(post_data);
            }
            request.post({
                url: url, 
                headers:{
                    'Content-Type': 'application/xml'
                },
                body: post_data
            },function(err,resp){
                console.log('1');
                console.log(resp.body);
              
                if(resp.body.errorCode)
                    res.send('error');
                else
                    res.send('sent');
                var writerId=req.user.brand.historyWriteBlurb[id].id;
                var writerIndex=req.user.brand.historyWriteBlurb[id].writerIndex;
                if(req.user.linkedinPostPageType!='group'){
                    var body=JSON.parse(resp.body);
                    console.log(access_token);
                    //console.log(body);
                    var linkedinPostId=body.updateKey;
                    req.user.brand.historyWriteBlurb[id].linkedinPostId=linkedinPostId;   //saving linked in post id
                    req.user.brand.historyWriteBlurb[id].linkedinAccessToken=access_token;
                    req.user.brand.historyWriteBlurb[id].postingLastDate = new Date();

                }
                // req.user.brand.historyWriteBlurb[id].status='Accepted';
                req.user.save(function(err){
                    if(err)
                        console.log(err);
                })
                //console.log('writer indexing '+writer_index);
                var blurbId = req.user.brand.historyWriteBlurb[id]._id;
                if(req.user.brand.historyWriteBlurb[id].id!=null){
                      payment.payForPost(req.user._id,writerId,blurbId);
                }  
            });
        }
    }
}
