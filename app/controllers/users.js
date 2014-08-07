var mongoose=require("mongoose"),
DBConnection=require("../models/DBConnection"),
//utils = require("./controllerUtils"),
conns=DBConnection.GET_CONNECTIONS(),
blurbiCon=conns.blurbiDBConnection,
User = blurbiCon.model('User'),
blurbiBotCon=conns.blurbiBotDBConnection,
usersBot=blurbiBotCon.model('usersbot'),
defaultBlurb=blurbiCon.model('defaultBlurb'),
adminDiscounts = blurbiCon.model('adminDiscounts'),
brandOwnBlurb = blurbiCon.model('brandOwnBlurb'),
fs = require('fs'),
//Step = require("Step"),
stripe,
paypal_sdk = require('paypal-rest-sdk'),
MailChimpAPI = require('mailchimp-api').Mailchimp,
apiKey = 'de6b808903a8eaa320c8dafd1d1ec67a-us3',
mandrill = require('node-mandrill')('rGyWrxsiJJ-pLg8ktCTh1Q'),
generatePassword = require('password-generator'),
embedly = require('embedly'),
util = require('util'),
Bitly = require('bitly'),
_ = require('underscore'),
request = require('request'),
gm = require('gm'),
bitly = new Bitly('romanmonist', 'R_02ca1d8804004b51a65363a83d455f65'),
paypal_sdk = require('paypal-rest-sdk');
server_url = "https://www.blurbi.ca/";
promo = require("../../config/promo");
interestMapping=require('./interestsMapping');
payment = require('./payment');

var discounts = promo.promoCode();
var unsub_link;


// var io;

exports.init = function(){
    // io = global_io;
    // console.log('hey');
    if(process.env.NODE_ENV){
        unsub_link = "https://localhost/users/unsubscribe?";
        paypal_sdk.configure({
          'host': 'api.sandbox.paypal.com',
          'port': '',
          'client_id': 'AaB6_BAfQmxtZhpZ513V-mW_OXS63AkVs6Do8yxofAEjArxid_lvaqGNrAEC',
          'client_secret': 'EFauBBAtfWvHGowNMKwtQTcc6pIh53-WyKVSpvqEh4yjbnBHSyVg1dA7Ah9G'
        });
        stripe = require('stripe-api')('sk_test_z6RgZutta11uTZppNaUvHDvc');
    }
    else{
        unsub_link = "https://www.blurbi.ca/users/unsubscribe?";
        paypal_sdk.configure({
            'host': 'api.paypal.com',
            'port': '',
            'client_id': 'ARku4xAVniEM0183lFs-iIMyX8o2HofUHlypXvURuxBMEXymKucvoYsCvKtY',
            'client_secret': 'EMqZFhCWylJvEwXvzQd6oVSolJWuoBi3K7ujZBShJ1CO7e25OPLaVAkIi5Cl'
        });
        stripe = require('stripe-api')('sk_live_pAY9lMr2ffyWvNnEaYFbzRwI');
    }
  
}


exports.scheduled = function(req,res){
    if(req.user.userType=='brand'){
            res.render('users/Scheduled',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            historyCallAction: req.user.brand.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            facebook: req.user.facebook,
            twitter: req.user.twitter,
            linkedin: req.user.linkedin,
            clients: req.user.brand.clients,
            campaignBalance:req.user.brand.campaignBalance,
            // profile:req.user.agency.profileInfo,
            // company:req.user.agency.profileInfo.company,
        });
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        if(brandIndex){
            User.findOne({_id: brandIndex}).exec(function(err,brand){
                if(brand){
                    res.render('users/Scheduled',{
                        name: req.user.name,
                        userType: req.user.userType,
                        clients: brand.brand.clients,
                        brandIndex: brandIndex,
                        brands: req.user.agency.brands,
                        historyWriteBlurb: brand.brand.historyWriteBlurb,
                        historyCallAction: brand.brand.historyCallAction,
                        brandLogoPath: brand.logoPath,
                        logoPath: req.user.logoPath,
                        accountBalance: brand.brand.accountBalance,
                        campaignBalance: brand.brand.campaignBalance,
                        RequestRecieve: brand.brand.RequestRecieve,
                        profile: brand.brand.profileInfo,
                        facebook: brand.facebook,
                        twitter: brand.twitter,
                        linkedin: brand.linkedin,
                        // profile:req.user.agency.profileInfo,
                        // company:req.user.agency.profileInfo.company,
                    });
                }
            })
        }
    }
}
exports.signout = function (req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
}
exports.getLogin = function(req,res){
    res.render('login');
}
exports.getSignup = function(req,res){
    res.render('signup');
}
exports.getWriters = function(req,res){
    res.render('writers');
}
exports.getEnterpriseSignup = function(req,res){
    res.render('enterprisesignup');
}
/*exports.getWritersRegistration = function(req,res){
    res.render('writersRegistration');
}*/
exports.setScheduleTime = function(req,res)
{
    console.log('Check it');
    var id=req.body.id
    console.log(req.session.brandIndex);
    if(req.body.userType == 'agency'){
        console.log('Agency');
        User.findOne({_id:req.session.brandIndex}).exec(function(err,user){
            if(!err && user)
            {
                user.brand.historyWriteBlurb[id].scheduleTime=req.body.dateTime;
                user.brand.historyWriteBlurb[id].facebook=req.body.facebook;
                user.brand.historyWriteBlurb[id].twitter=req.body.twitter;
                user.brand.historyWriteBlurb[id].linkedin=req.body.linkedin;
                user.save(function(err){
                    if(err)
                        console.log(err);
                    
                })
                var writerId=user.brand.historyWriteBlurb[id].id;
                var blurbId = user.brand.historyWriteBlurb[id]._id;
                if(user.brand.historyWriteBlurb[id].id!=null){
                      payment.payForPost(user._id,writerId,blurbId);
                }
            }
            res.send('Done');
        });
    }
    else{
        
        req.user.brand.historyWriteBlurb[id].scheduleTime=req.body.dateTime;
        req.user.brand.historyWriteBlurb[id].facebook=req.body.facebook;
        req.user.brand.historyWriteBlurb[id].twitter=req.body.twitter;
        req.user.brand.historyWriteBlurb[id].linkedin=req.body.linkedin;
        req.user.save(function(err){
            if(err)
                console.log('Error');
            else
            {
                console.log('Save');
               
            }
            var writerId=req.user.brand.historyWriteBlurb[id].id;
            var blurbId = req.user.brand.historyWriteBlurb[id]._id;
            if(req.user.brand.historyWriteBlurb[id].id!=null){
                  payment.payForPost(req.user._id,writerId,blurbId);
            }
            res.send('Done');
        });
    }
    // console.log(req.body);
}

exports.setscheduleTimeOwnBlurb = function(req,res)
{
    console.log(req.body);
    var ownBlurb = brandOwnBlurb({'brandId': req.user._id});
    ownBlurb.scheduleTime=req.body.dateTime;
    ownBlurb.facebook=req.body.facebook;
    ownBlurb.twitter=req.body.twitter;
    ownBlurb.linkedin=req.body.linkedin;
    ownBlurb.creator=req.user._id;
    ownBlurb.save(function(err){
        if(err)
            console.log(err);
        
    })

    // console.log('Check it');
    // var id=req.body.id
    // console.log(req.session.brandIndex);
    // if(req.body.userType == 'agency'){
    //     console.log('Agency');
    //     User.findOne({_id:req.session.brandIndex}).exec(function(err,user){
    //         if(!err && user)
    //         {
    //             user.brand.historyWriteBlurb[id].scheduleTime=req.body.dateTime;
    //             user.brand.historyWriteBlurb[id].facebook=req.body.facebook;
    //             user.brand.historyWriteBlurb[id].twitter=req.body.twitter;
    //             user.brand.historyWriteBlurb[id].linkedin=req.body.linkedin;
    //             user.save(function(err){
    //                 if(err)
    //                     console.log(err);
                    
    //             })
    //             var writerId=user.brand.historyWriteBlurb[id].id;
    //             var blurbId = user.brand.historyWriteBlurb[id]._id;
    //             if(user.brand.historyWriteBlurb[id].id!=null){
    //                   payment.payForPost(user._id,writerId,blurbId);
    //             }
    //         }
    //         res.send('Done');
    //     });
    // }
    // else{
        
    //     req.user.brand.historyWriteBlurb[id].scheduleTime=req.body.dateTime;
    //     req.user.brand.historyWriteBlurb[id].facebook=req.body.facebook;
    //     req.user.brand.historyWriteBlurb[id].twitter=req.body.twitter;
    //     req.user.brand.historyWriteBlurb[id].linkedin=req.body.linkedin;
    //     req.user.save(function(err){
    //         if(err)
    //             console.log('Error');
    //         else
    //         {
    //             console.log('Save');
               
    //         }
    //         var writerId=req.user.brand.historyWriteBlurb[id].id;
    //         var blurbId = req.user.brand.historyWriteBlurb[id]._id;
    //         if(req.user.brand.historyWriteBlurb[id].id!=null){
    //               payment.payForPost(req.user._id,writerId,blurbId);
    //         }
    //         res.send('Done');
    //     });
    // }
    // // console.log(req.body);
}
exports.setRescheduleTime = function(req,res)
{
    var blurbId = req.body.blurbId;
    if(req.user.userType == 'agency')
    {
        console.log('Agency');
        var blurb = req.body.id
        User.findOne({_id:req.session.brandIndex}).exec(function(err,user){
            if(!err && user){
                var blurb = _.filter(user.brand.historyWriteBlurb,function(item){ return item._id == blurbId});
                if(blurb.length > 0){
                    blurb[0].scheduleTime=req.body.dateTime;
                    blurb[0].facebook=req.body.facebook;
                    blurb[0].twitter=req.body.twitter;
                    blurb[0].linkedin=req.body.linkedin;
                    user.save(function(err){
                        if(err)
                            console.log(err);
                        else
                            res.send('Done');
                    })

                }
                
            }
        });
    }
    else
    {
        var blurb = _.filter(req.user.brand.historyWriteBlurb,function(item){ return item._id == blurbId});
        if(blurb.length > 0){
            blurb[0].scheduleTime=req.body.dateTime;
            blurb[0].facebook=req.body.facebook;
            blurb[0].twitter=req.body.twitter;
            blurb[0].linkedin=req.body.linkedin;
            req.user.save(function(err){
                if(err)
                    console.log(err);
                else
                    res.send('Done');
            })

        }
        
    }
    // console.log(req.body);
}

exports.signup = function(req,res){
    console.log(req.body);
    var change_password_link;
    var login_link;
    var active_link;
    if(process.env.NODE_ENV){
        change_password_link = "https://localhost/users/redirectChangePassword";
        login_link = "https://localhost/users/redirectLogin";
        active_link = "https://localhost/users/activeAccount/";
    }
    else{
        change_password_link = "https://blurbi.ca/users/redirectChangePassword";
        login_link = "https://blurbi.ca/users/redirectLogin";
        active_link = "https://www.blurbi.ca/users/activeAccount/";
    }
    if(req.body.radio=='writer'){
        req.session.writer_name = req.body.name;
        req.session.writer_email = req.body.email;
        req.session.password = req.body.password;
        res.render('writersRegistration');
    }
    else{
            User.findOne({
            'email' : req.body.email
            }).exec(function(err,user){
            if(user){
                res.send('This email is not available.');
            }
            else{
                var user = new User(req.body);
                var pass = req.body.password;
                console.log(pass);
                user.setPassword(pass);
                if(req.body.radio=='enterprise'){
                    user.userType = 'brand';
                    user.brandType = 'enterprise';
                }
                else{
                    user.userType = req.body.radio;
                }
                user.validationCode = pass;
                var today=new Date();
                var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                var uniqid = randLetter + Date.now();
                user.promoCode = uniqid;
                today=today.toDateString();
                user.joiningDate= today;

                //user have 7 days for validation of their account
                user.valid=false;

                user.save(function(err){
                    if(err)
                        console.log(err);
                    else{
                        req.logIn(user, function(err) {
                            //console.log(user);
                            if (err) return next(err)
                            if(req.body.radio=='brand' || req.body.radio == 'enterprise' )
                                res.redirect('/linkto');
                            else if(req.body.radio=='agency')
                                res.redirect('/agencySignup1');
                            if(req.body.radio=='agency'){
                                user.agency.emailSettings = ['SiteActions','SiteNews','HelpfulStuff'] ;
                                user.save(function(err){
                                    if(err)
                                        console.log(err);
                                })
                            }
                            if(req.body.radio=='brand' || req.body.radio == 'enterprise'){
                                active_link = active_link + '?email=' + req.body.email + '&id=' + user._id;
                                
                            }
                            var changed_link = unsub_link + 'user_id=' + user._id;
                            mandrill('/messages/send-template', {
                                "template_name" : "Blurbi Buyer Sign-up confirmation",
                                "template_content" :  [
                                ]  ,
                                "message": {
                                    to: [{
                                        email: req.body.email
                                        }],
                                    from_email: 'derek@blurbi.ca',
                                    subject: "Thanks for signing up on Blurbi!",
                                    "merge": true,
                                    "merge_vars": [
                                    {
                                        "rcpt": req.body.email,
                                        "vars": [
                                            {
                                                "name": "user",
                                                "content": req.body.name                                    
                                            },
                                            {
                                                "name": "pass",
                                                "content": pass
                                            },
                                            {
                                                "name": "UNSUB",
                                                "content": changed_link
                                            },
                                            {
                                                "name" : "change_password_link",
                                                "content" : change_password_link
                                            },
                                            {
                                                "name" : "login_link",
                                                "content" : login_link
                                            },
                                            {
                                                "name" : "active_link",
                                                "content" : active_link
                                            }
                                        ]
                                    }
                                    ],
                                },
                            }, function(error, response){
                                //console.log("djfksdf");
                                //uh oh, there was an error
                                if (error) console.log( JSON.stringify(error) );
                                //everything's good, lets see what mandrill said
                                else console.log(response);
                                //console.log("HERE");
                            });
                        });
                    }
                })
            }
        })
    }
}
exports.emailAvailability=function(req,res){

    var email = req.body.email;
    if(req.user){
        User.findOne({
        'email': email
        }).exec(function(err,user){
            if(err) console.log(err);
            //console.log(user);
            if(!err && user){
                console.log(user._id);
                console.log(req.user._id);
                if(user._id.equals(req.user._id))
                {
                    console.log('here');
                    res.send("available");
                }
                else
                {
                    res.send("not available");
                }

            }
            else{
                res.send("available");

            }
        });

    }
    else{

        User.findOne({
        'email': email
        }).exec(function(err,user){
            if(err) console.log(err);
            //console.log(user);
            if(user)
            {
                res.send("not available");
            }
            else
            {
                res.send("available");
            }
        });

    }
   
}
exports.agencySignup1 = function(req,res){

    res.render('agencySignup1',{
        name: req.user.name,
        userType: req.user.userType,
        valid: req.user.valid
    })
    
}
exports.agencySignup2 = function(req,res){
    console.log('Email: '+req.user.email);
    var brandIndex = req.session.brandIndex;

    User.findOne({'_id' : brandIndex}).exec(function(err,user){
        if(!err && user){
            res.render('agencySignup2',{
                name: req.user.name,
                userType: req.user.userType,
                logoPath: {logoPath: user.logoPath},
                valid: req.user.valid,
                email: req.user.email
            })

        }
        else{
            res.render('agencySignup2',{
                name: req.user.name,
                userType: req.user.userType,
                valid: req.user.valid,
                email: req.user.email
            })
        }
    })
    
}
exports.agencySignup1Post = function(req,res){
    req.user.agency.profileInfo=req.body;
    req.user.profileSet = true;
    req.user.save(function(err){
        if(err)
            console.log(err);
    //else
    //console.log(req.user);
    })
    res.redirect('/agencylinkTo');
}
exports.brandSignup1 = function(req,res){
    if(req.user.profileSet){
        res.redirect('/users/home');
    }
    else{
        res.render('brandSignup1',{
            name: req.user.name,
            userType: req.user.userType,
            valid: req.user.valid,
            profileInfo: req.user.brand.profileInfo,
            logoPath: { 'logoPath' : req.user.logoPath }
        })
    }
}
exports.writerSignup1 = function(req,res){
    var status;
    var fg=0;
    var acceptance;
    var brands = new Array();
    User.find({
        'brand.profileInfo.company': {
            $ne: null
        }
    }).exec(function(err,user){
        for(var i=0;i<user.length;i++){
            acceptance = 0;
            for(var j=0;j<user[i].brand.historyWriteBlurb.length;j++){
                if(user[i].brand.historyWriteBlurb[j].status=='Accepted')
                {
                    acceptance++;
                }
            }
            if(user[i].brand.historyWriteBlurb.length>0)
                acceptance = Math.floor((acceptance/user[i].brand.historyWriteBlurb.length)*100)
            // console.log(user[i].brand.pricePerBlurb);
            brands.push({
                'profileInfo': user[i].brand.profileInfo, 
                'id' : user[i]._id, 
                'logoPath' : user[i].logoPath, 
                'acceptance' : acceptance, 
                'pricePerBlurb' : user[i].brand.pricePerBlurb
                });
        }
        if(req.user.writerType=='internal'){
                console.log('hey');
                res.render('writerSignup1',{
                    name: req.user.name,
                    userType: req.user.userType,
                    accountBalance: req.user.writer.accountBalance,
                    clients: req.user.writer.clients,
                    historyCallAction: req.user.writer.historyCallAction,
                    RequestRecieve: req.user.writer.RequestRecieve,
                    RequestSend: req.user.writer.RequestSend,
                    writerPerticipated: req.user.writer.writerPerticipated,
                    brands: brands,
                    logoPath: req.user.logoPath,
                    writerType: req.user.writerType
                })
        }
        else{
            res.render('writerSignup1',{
                name: req.user.name,
                userType: req.user.userType,
                accountBalance: req.user.writer.accountBalance,
                clients: req.user.writer.clients,
                historyCallAction: req.user.writer.historyCallAction,
                RequestRecieve: req.user.writer.RequestRecieve,
                RequestSend: req.user.writer.RequestSend,
                writerPerticipated: req.user.writer.writerPerticipated,
                brands: brands,
                logoPath: req.user.logoPath,
                writerType: 'external'
            })
        }
    })
}
exports.brandSignup1Post = function(req,res){
    // console.log(req.body);
    var promoCode = req.body.promoCode;
    req.user.brand.profileInfo=req.body;
    req.user.profileSet = true;
    req.user.save(function(err){
        if(err)
            console.log(err);
        signupDefaultBlurbs(req.user._id, req.body.interest);
        autoMatch(req.user._id, req.body.interest);
        if(promoCode){
            console.log('before calling calculateUserDiscount');
            calculateUserDiscount(promoCode);
        }
        res.redirect('/users/home');
    //else
    //console.log(req.user);
    })
  
}

exports.improveProfile = function(req,res){
   
    // console.log(req.body);

    if(req.user.userType == 'brand'){

        console.log(req.body.company);

        if((req.body.company != '') && (req.body.company != undefined) ){
            req.user.brand.profileInfo.company = req.body.company;
        }
            

        if((req.body.companyUrl != '') && (req.body.companyUrl != undefined)){
            req.user.brand.profileInfo.companyUrl = req.body.companyUrl;
        }
           

        if((req.body.country != '') && (req.body.country != undefined) ){
            req.user.brand.profileInfo.country = req.body.country;
        }

        if((req.body.countryFlag != '') && (req.body.countryFlag != undefined) ){
            req.user.brand.profileInfo.countryFlag = req.body.countryFlag;
        }
            

        if((req.body.customerCountry != '') && (req.body.customerCountry != undefined) ){
            req.user.brand.profileInfo.customerCountry = req.body.customerCountry;
        }


        if((req.body.customerCountryFlag != '') && (req.body.customerCountryFlag != undefined) ){
            req.user.brand.profileInfo.customerCountryFlag = req.body.customerCountryFlag;
        }
            

        if((req.body.description != '') && (req.body.description != undefined) ){
            req.user.brand.profileInfo.description = req.body.description;
        }

        if((req.body.interest != '') && (req.body.interest != undefined) ){
            req.user.brand.profileInfo.interest = req.body.interest;
        }

        if((req.body.voice1 != '') && (req.body.voice1 != undefined)){
            req.user.brand.profileInfo.voice1 = req.body.voice1;
        }
            

        if((req.body.voice2 != '') && (req.body.voice2 != undefined) ){
            req.user.brand.profileInfo.voice2 = req.body.voice2;
        }
             

        if((req.body.voice3 != '') && (req.body.voice3 != undefined) ){
            req.user.brand.profileInfo.voice3 = req.body.voice3;
        }
            

        if((req.body.range1 != '') && (req.body.range1 != undefined) ){
            req.user.brand.profileInfo.range1 = req.body.range1; 
        }
             

        if((req.body.range2 != '') && (req.body.range2 != undefined) ){
            req.user.brand.profileInfo.range2 = req.body.range2;  
        }

        if((req.body.emulatePage1 != '') && (req.body.emulatePage1 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage1 = req.body.emulatePage1;
        }

        if((req.body.emulatePage2 != '') && (req.body.emulatePage2 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage2 = req.body.emulatePage2;
        }

        if((req.body.emulatePage3 != '') && (req.body.emulatePage3 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage3 = req.body.emulatePage3;
        }

        if((req.body.emulatePage4 != '') && (req.body.emulatePage4 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage4 = req.body.emulatePage4;
        }

        if((req.body.emulatePage5 != '') && (req.body.emulatePage5 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage5 = req.body.emulatePage5;
        }

        if((req.body.emulatePage6 != '') && (req.body.emulatePage6 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage6 = req.body.emulatePage6;
        }

        if((req.body.emulatePage7 != '') && (req.body.emulatePage7 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage7 = req.body.emulatePage7;
        }

        if((req.body.emulatePage8 != '') && (req.body.emulatePage8 != undefined) ){
            req.user.brand.profileInfo.emulatePage.emulatePage8 = req.body.emulatePage8;
        }



        req.user.save(function(err){

            if(err){
                console.log(err);
            }else{
                console.log('done');
                if(req.body.interest){
                    autoMatch(req.user._id, req.body.interest);
                    editInterestList(req.user._id,req.body.interest);

                }
                
                res.send();
            }

        });


    }



    if(req.user.userType == 'agency'){

        var brandId = req.session.brandIndex;

        User.findOne({'_id': brandId}).exec(function(err,brand){

            if(brand){


                if((req.body.company != '') && (req.body.company != undefined) ){

                    var find = _.filter(req.user.agency.brands,function(item){ return item.id == brandId});

                    console.log(find);

                    if(find.length>0){

                        find[0].company = req.body.company;

                        req.user.save(function(err){
                            if(err){
                                console.log(err);
                            }else{
                                console.log('company name saved');
                            }
                        });
                    }

       
                }

               


                if((req.body.company != '') && (req.body.company != undefined) ){
                    brand.brand.profileInfo.company = req.body.company;
                }
                    

                if((req.body.companyUrl != '') && (req.body.companyUrl != undefined)){
                    brand.brand.profileInfo.companyUrl = req.body.companyUrl;
                }
                   

                if((req.body.country != '') && (req.body.country != undefined) ){
                    brand.brand.profileInfo.country = req.body.country;
                }

                if((req.body.countryFlag != '') && (req.body.countryFlag != undefined) ){
                    brand.brand.profileInfo.countryFlag = req.body.countryFlag;
                }
                    

                if((req.body.customerCountry != '') && (req.body.customerCountry != undefined) ){
                    brand.brand.profileInfo.customerCountry = req.body.customerCountry;
                }

                if((req.body.customerCountryFlag != '') && (req.body.customerCountryFlag != undefined) ){
                    brand.brand.profileInfo.customerCountryFlag = req.body.customerCountryFlag;
                }
                    

                if((req.body.description != '') && (req.body.description != undefined) ){
                    brand.brand.profileInfo.description = req.body.description;
                }

                if((req.body.interest != '') && (req.body.interest != undefined) ){
                    brand.brand.profileInfo.interest = req.body.interest;
                }

                if((req.body.voice1 != '') && (req.body.voice1 != undefined)){
                    brand.brand.profileInfo.voice1 = req.body.voice1;
                }
                    

                if((req.body.voice2 != '') && (req.body.voice2 != undefined) ){
                    brand.brand.profileInfo.voice2 = req.body.voice2;
                }
                     

                if((req.body.voice3 != '') && (req.body.voice3 != undefined) ){
                    brand.brand.profileInfo.voice3 = req.body.voice3;
                }
                    

                if((req.body.range1 != '') && (req.body.range1 != undefined) ){
                    brand.brand.profileInfo.range1 = req.body.range1; 
                }
                     

                if((req.body.range2 != '') && (req.body.range2 != undefined) ){
                    brand.brand.profileInfo.range2 = req.body.range2;  
                }

                if((req.body.emulatePage1 != '') && (req.body.emulatePage1 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage1 = req.body.emulatePage1;
                }

                if((req.body.emulatePage2 != '') && (req.body.emulatePage2 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage2 = req.body.emulatePage2;
                }

                if((req.body.emulatePage3 != '') && (req.body.emulatePage3 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage3 = req.body.emulatePage3;
                }

                if((req.body.emulatePage4 != '') && (req.body.emulatePage4 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage4 = req.body.emulatePage4;
                }

                if((req.body.emulatePage5 != '') && (req.body.emulatePage5 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage5 = req.body.emulatePage5;
                }

                if((req.body.emulatePage6 != '') && (req.body.emulatePage6 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage6 = req.body.emulatePage6;
                }

                if((req.body.emulatePage7 != '') && (req.body.emulatePage7 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage7 = req.body.emulatePage7;
                }

                if((req.body.emulatePage8 != '') && (req.body.emulatePage8 != undefined) ){
                    brand.brand.profileInfo.emulatePage.emulatePage8 = req.body.emulatePage8;
                }


                brand.save(function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log('saved');
                        if(req.body.interest){
                            autoMatch(brand._id, req.body.interest);
                            editInterestList(brand._id,req.body.interest);
                        }
                        res.redirect('/users/agencyBrandProfile');
                       
                    }
                });
                
            }else{
                console.log(err);
            }

        });
    }



    if(req.user.userType == 'writer'){

        console.log('writer section');
        if((req.body.name != '') && (req.body.name != undefined) ){
            req.user.writer.profileInfo.name = req.body.name;
        }             

        if((req.body.country != '') && (req.body.country != undefined) ){
            req.user.writer.profileInfo.country = req.body.country;
        }

        if((req.body.interest != '') && (req.body.interest != undefined)){
            req.user.writer.profileInfo.interest = req.body.interest;
        }

        if((req.body.countryFlag != '') && (req.body.countryFlag != undefined)){
            req.user.writer.profileInfo.countryFlag = req.body.countryFlag;
        }


        req.user.save(function(err){
            if(err){
                console.log(err);
            }else{
                console.log('done improving');
                res.send();
                if(req.body.interest){
                    autoMatch(req.user._id, req.body.interest);
                    editInterestList(req.user._id,req.body.interest);

                }
              
            }
        });

       
    }


    



   
}




exports.writerSignup1Post = function(req,res){
    //console.log(req.body);
    req.user.name = req.body.user_name;
    req.user.writer.profileInfo=req.body;
    req.user.profileSet = true;
    req.user.save(function(err){
        if(err)
            console.log(err);
    //else
    //console.log(req.user);
    })
    res.redirect('/users/writeBlurbs');
}
exports.agencySignup2Post = function(req,res){

    // console.log(req.body);
    console.log(req.session.brandIndex);
    var brandIndex = req.session.brandIndex;
    User.findOne({'_id': brandIndex}).exec(function(err,user){
        if(!err && user){
            if(req.files.brand_image.name){
                var file;
                file = req.files;
                fs.readFile(req.files.brand_image.path, function (err, data) {
                    fs.writeFile('public/profile_pictures/'+ user._id + req.files.brand_image.name,data, function (err) {
                        if (err) throw err;
                            fs.unlink(req.files.brand_image.path, function (err){
                              if (err)
                                 throw err;
                              else
                              {
                                console.log('file deleted');

                              }
                            }); 
                    });
                });
            }
            user.brand.profileInfo = req.body;
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            var uniqid = randLetter + Date.now();
            user.promoCode = uniqid;
            if(file){
                   user.logoPath = 'profile_pictures/' + user._id + file.brand_image.name ;
                   req.user.agency.brands.push({
                    'id' : user._id, 
                    'company' : user.brand.profileInfo.company, 
                    'logoPath' : user.logoPath
                });
                req.user.save(function(err){
                    if(err)
                        console.log(err);
                })
            }
            else{  
                req.user.agency.brands.push({
                    'id' : user._id, 
                    'company' : user.brand.profileInfo.company
                });
                req.user.save(function(err){
                    if(err)
                        console.log(err);
                })
            }
           

            var today=new Date();
            today=today.toDateString();
            user.joiningDate= today;
            user.lastLogin = req.user.lastLogin;
            
            user.brand.emailSettings = ['SiteActions','SiteNews','HelpfulStuff'] ;
            user.save(function(err){
                if(err)
                    console.log(err);
                signupDefaultBlurbs(user._id, req.body.interest);
                autoMatch(user._id, req.body.interest);
            })
            req.session.brandIndex = null;
            if(req.body.add_or_finish == 'add')
                res.redirect('/agencylinkTo');
            else if(req.body.add_or_finish== 'finish')
                res.redirect('/users/home');

        }
    })
 

}
exports.logo =  function(req,res){
    var file = req.files;
    fs.readFile(req.files.image.path, function (err, data) {
        fs.writeFile('public/profile_pictures/' + req.user._id + req.files.image.name ,data, function (err) {
            if (err) throw err;
            fs.unlink(req.files.image.path, function (err){
              if (err)
                 throw err;
              else
              {
                console.log('file deleted');

              }
            });  
        });
    });
    req.user.logoPath='profile_pictures/'+ req.user._id + file.image.name;
    gm('public/'+req.user.logoPath)
      .resize(600, 450, '!')
      .write('public/'+req.user.logoPath, function(err){
        if (err) return console.dir(arguments)
        console.log(this.outname + " created  ::  " + arguments[3])
      }
    )
    req.user.save(function(err){
        if(err)
            console.log(err)
        else
            console.log(req.user.logoPath);
    })
    res.send(file);
}

exports.agencylogo =  function(req,res){
  
    console.log('agencylogo');

    var brandIndex = req.session.brandIndex;
    var file = req.files;
 
    fs.readFile(req.files.image.path, function (err, data) {

        if(brandIndex){


            for(var i=0;i<req.user.agency.brands.length;i++)
            {
                

                if(req.user.agency.brands[i].id==brandIndex){
                    console.log(brandIndex);
                    req.user.agency.brands[i].logoPath = 'profile_pictures/' + req.user.agency.brands[i].id + req.files.image.name ;
                    
                    gm('public/'+req.user.agency.brands[i].logoPath)
                      .resize(600, 450, '!')
                      .write('public/'+req.user.agency.brands[i].logoPath, function(err){
                        if (err) return console.dir(arguments)
                        console.log(this.outname + " created  ::  " + arguments[3])
                      }
                    )



                    req.user.save(function(err){
                        if(err)
                            console.log(err);
                    })



                    gm('public/'+req.user.agency.brands[i].logoPath)
                      .resize(600, 450, '!')
                      .write('public/'+req.user.agency.brands[i].logoPath, function(err){
                        if (err) return console.dir(arguments)
                        console.log(this.outname + " created  ::  " + arguments[3])
                      }
                    )

                }
            }

            
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){

                 fs.writeFile('public/profile_pictures/'+ user._id + req.files.image.name ,data, function (err) {
                    if (err) throw err;
                    else{
                        var brandIndex = req.session.brandIndex;
                        user.logoPath='profile_pictures/' + user._id + req.files.image.name ;
                        fs.unlink(req.files.image.path, function (err){
                          if (err)
                             throw err;
                          else
                          {
                            console.log('file deleted');

                          }
                        }); 
                    


                        gm('public/'+user.logoPath)
                          .resize(600, 450, '!')
                          .write('public/'+user.logoPath, function(err){
                            if (err) return console.dir(arguments)
                            console.log(this.outname + " created  ::  " + arguments[3])
                          }
                        )

                        console.log(user.logoPath);
                        user.save(function(err){
                            if(err)
                                console.log(err)
                        
                        })

                    } 
                });

               gm('public/'+user.logoPath)
                  .resize(600, 450, '!')
                  .write('public/'+user.logoPath, function(err){
                    if (err) return console.dir(arguments)
                    console.log(this.outname + " created  ::  " + arguments[3])
                  }
                )




            })




        }
      
       
    });

    res.send(file);


 

}

exports.linkTo=function(req,res){
    // console.log(req.user);
    if(req.user.valid){
        res.redirect('/users/home');
    }
    else{
        res.render('linkTo',{
            name: req.user.name,
            userType: req.user.userType,
            facebook: req.user.facebook,
            twitter: req.user.twitter,
            linkedin: req.user.linkedin,
            valid: req.user.valid,
            logoPath: req.user.logoPath
        })

    }
   
}
exports.agencylinkTo = function(req,res){

   
    if(!req.session.brandIndex){
        var user = new User({'userType': 'brand'});
        user.save(function(err){
            if(err)
                console.log(err);
        })
        req.session.brandIndex = user._id;
        res.render('agencylinkTo');

    }
    else{
        var brandIndex = req.session.brandIndex;
        User.findOne({'_id': brandIndex}).exec(function(err,user){
            if(!err && user){
                res.render('agencylinkTo',{
                    facebook: user.facebook,
                    twitter: user.twitter,
                    linkedin: user.linkedin
                });

            }
            else{
                res.render('agencylinkTo');
            }
        })

    }
   
       
        
  

}
exports.authCallback = function (req, res, next) {
    
    if(req.session.auth_type){
        if(req.session.auth_type=='facebook'){
            req.session.auth_type = null;
            res.redirect('/selectPage?auth_type=facebook');
        }
        if(req.session.auth_type=='linkedin'){
            req.session.auth_type = null;
            res.redirect('/selectPage?auth_type=linkedin')
        }
        if(req.session.auth_type=='twitter'){
            req.session.auth_type = null;
            if(req.user.userType=='agency'){
                var brandIndex = req.session.brandIndex;
                User.findOne({'_id': brandIndex}).exec(function(err,user){
                    if(!err && user){
                        var uri = req.user.twitter.profile_image_url_https;
                        request.head(uri, function(err, res, body){

                            // console.log('content-type:', res.headers['content-type']);
                            // console.log('content-length:', res.headers['content-length']);
                            var filename = 'public/profile_pictures/' + user._id + '.jpg';
                            request(uri).pipe(fs.createWriteStream(filename));
                            if(!user.logoPath){
                                user.logoPath = 'profile_pictures/' + user._id + '.jpg';
                                user.save(function(err){
                                    if(err)
                                        console.log(err);
                                })
                            }
                           
                        });
                    }
                })

            }
            else if(req.user.userType=='brand'){
                req.session.auth_type = null;
                var uri = req.user.twitter.profile_image_url_https;
                request.head(uri, function(err, res, body){

                    // console.log('content-type:', res.headers['content-type']);
                    // console.log('content-length:', res.headers['content-length']);
                    var filename = 'public/profile_pictures/' + req.user._id + '.jpg';
                    request(uri).pipe(fs.createWriteStream(filename));
                    if(req.user.logoPath!=null){
                        req.user.logoPath = 'profile_pictures/' + req.user._id + '.jpg';
                        req.user.save(function(err){
                            if(err)
                                console.log(err);
                        })
                    }
                   
                });
            }
            res.redirect('/dummyForCallback');
            

        }
    }
    else{

        res.redirect('/dummyForCallback');

    }
       
}
exports.home = function(req,res){
    //console.log('comes here 2');
    req.user.lastLogin = new Date().toDateString();
    req.user.save(function(err){
        if(err)
            console.log(err);
    })
    if(req.user.userType=='brand'){
         
        if(req.session.auth_type){
            if(req.session.auth_type=='facebook'){
                req.session.auth_type = null;
                res.redirect('/selectPage?auth_type=facebook');
            }
            if(req.session.auth_type=='linkedin'){
                req.session.auth_type = null;
                res.redirect('/selectPage?auth_type=linkedin')
            }
        }
        else{
             if(req.user.brand.profileInfo.company){
                
                if(req.session.change_password)
                {
                    req.session.change_password = null;
                    res.redirect('/users/settings#change_password');
                }
                else if(req.session.unsubscribe)
                {
                    req.session.unsubscribe = null;
                    res.redirect('/users/settings#unsubscribe');
                }
                else
                    res.redirect('/users/brandContent');
            
            }
            else
                res.redirect('/brandSignup1');
        }
    }
    else if(req.user.userType=='writer'){
        console.log("writer");
     
        if(req.session.change_password)
        {
            req.session.change_password = null;
            res.redirect('/users/settings#change_password');
        }
        else if(req.session.unsubscribe)
        {
            req.session.unsubscribe = null;
            res.redirect('/users/settings#unsubscribe');
        }
        else{
            if(req.user.writer.profileInfo)
                res.redirect('/users/writerContent');
            else
                res.redirect('/writerSignup1');
        }
    }
    else if(req.user.userType=='admin'){
        console.log("admn")
        res.redirect('/users/adminPage')
    }
    else {
        console.log("here");
         if(req.session.auth_type){
            if(req.session.auth_type=='facebook'){
                req.session.auth_type = null;
                res.redirect('/selectPage?auth_type=facebook');
            }
            if(req.session.auth_type=='linkedin'){
                req.session.auth_type = null;
                res.redirect('/selectPage?auth_type=linkedin')
            }
        }
        else{
            if(req.user.agency.profileInfo.company){
                
                if(req.session.change_password)
                {
                    req.session.change_password = null;
                    res.redirect('/users/settings#change_password');
                }
                else if(req.session.unsubscribe)
                {
                    req.session.unsubscribe = null;
                    res.redirect('/users/settings#unsubscribe');
                }
                else
                    res.redirect('/users/profile');
                
            }
            else
            {
                console.log("hello hello");
                res.redirect('/agencySignup1');
            }
        }
    }
}

exports.selectPage = function(req,res){
    if(req.user.userType=='brand'){
        var auth_type=req.param('auth_type');
        res.render('selectPage',{
            name: req.user.name,
            userType: req.user.userType,
            logoPath: req.user.logoPath,
            auth_type: {auth_type: auth_type},
            facebookPageInfo: req.user.facebookPageInfo,
            facebookGroupInfo: req.user.facebookGroupInfo,
            facebookPostPageType: {type: req.user.facebookPostPageType},
            linkedinGroupInfo: req.user.linkedinGroupInfo,
            linkedinCompanyInfo: req.user.linkedinCompanyInfo,
            linkedinPostPageType: {type: req.user.linkedinPostPageType} 
        })
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        console.log("there");
        console.log(brandIndex);
        var auth_type=req.param('auth_type');
        console.log(auth_type);
        User.findOne({
            '_id' : brandIndex
        }).exec(function(err,brand){
            res.render('selectPage',{
                name: req.user.name,
                userType: req.user.userType,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                logoPath: req.user.logoPath,
                facebook: brand.facebook,
                twitter: brand.twitter,
                linkedin: brand.linkedin,
                auth_type: {auth_type: auth_type},
                facebookPageInfo: brand.facebookPageInfo,
                facebookGroupInfo: brand.facebookGroupInfo,
                facebookPostPageType: {type: brand.facebookPostPageType},
                linkedinGroupInfo: brand.linkedinGroupInfo,
                linkedinCompanyInfo: brand.linkedinCompanyInfo,
                linkedinPostPageType: {type: brand.linkedinPostPageType}
            })
        })
    }
}
exports.deselectPage = function(req,res){
    //console.log(req.body);
    var type = req.body.type;
    if(req.user.userType == 'brand'){
        if(type=='facebook'){
            req.user.facebookPostPageType = 'profile';
            var params = {
                    access_token: req.user.facebookAccessToken,
                };
                var url = 'https://graph.facebook.com/' + me +'/?fields=picture';
                request.get({  url: url, params: params}, function(err, resp) {
                   if(!err){
                       var body = JSON.parse(resp.body);
                       if(body.picture.data){
                            
                            var uri = body.picture.data.url;
                            request.head(uri, function(err, res, body){

                                // console.log('content-type:', res.headers['content-type']);
                                // console.log('content-length:', res.headers['content-length']);
                                var filename = 'public/profile_pictures/' + req.user._id + '.jpg';
                                request(uri).pipe(fs.createWriteStream(filename));
                                if(req.user.logoPath!=null){
                                    req.user.logoPath = 'profile_pictures/' + req.user._id + '.jpg';
                                    req.user.save(function(err){
                                        if(err)
                                            console.log(err);
                                    })
                                }
                               
                            });


                       }

                   }
                })
        }
        else if (type=='linkedin'){
            req.user.linkedinPostPageType = 'profile';
        }
        req.user.save(function(err){
            if(err)
                console.log(err);
            else 
                res.send('ok');
        })

    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({'_id': brandIndex}).exec(function(err,user){
            if(!err && user){
                if(type=='facebook'){
                    user.facebookPostPageType = 'profile';
                    var params = {
                            access_token: user.facebookAccessToken,
                        };
                        var url = 'https://graph.facebook.com/' + me +'/?fields=picture';
                        request.get({  url: url, params: params}, function(err, resp) {
                           if(!err){
                               var body = JSON.parse(resp.body);
                               if(body.picture.data){
                                    
                                    var uri = body.picture.data.url;
                                    request.head(uri, function(err, res, body){

                                        // console.log('content-type:', res.headers['content-type']);
                                        // console.log('content-length:', res.headers['content-length']);
                                        var filename = 'public/profile_pictures/' + user._id + '.jpg';
                                        request(uri).pipe(fs.createWriteStream(filename));
                                        if(!user.logoPath){
                                            user.logoPath = 'profile_pictures/' + user._id + '.jpg';
                                            user.save(function(err){
                                                if(err)
                                                    console.log(err);
                                            })
                                        }
                                       
                                    });


                               }

                           }
                        })
                }
                else if (type=='linkedin'){
                    user.linkedinPostPageType = 'profile';
                }
                user.save(function(err){
                    if(err)
                        console.log(err);
                    else 
                        res.send('ok');
                })


            }
        })
    }

}
exports.selectPagePost = function(req,res){
    //console.log(req.body);
    var page_type = req.body.page_type;
    var data = req.body.data;
    var channel = req.body.channel;
    if(req.user.userType=='brand'){
        if(channel=='facebook'){
            req.user.facebookPostPageType = req.body.page_type;
            if(page_type=='group'){
                req.user.facebookGroupInfo = data;

                var params = {
                    access_token: req.user.facebookAccessToken,
                };
                var url = 'https://graph.facebook.com/' + data.id +'/?fields=picture';
                request.get({  url: url, params: params}, function(err, resp) {
                   if(!err){
                       var body = JSON.parse(resp.body);
                       if(body.picture.data){
                        
                            var uri = body.picture.data.url;
                            request.head(uri, function(err, res, body){

                                // console.log('content-type:', res.headers['content-type']);
                                // console.log('content-length:', res.headers['content-length']);
                                var filename = 'public/profile_pictures/' + req.user._id + '.jpg';
                                request(uri).pipe(fs.createWriteStream('filename'));
                                if(req.user.logoPath!=null){
                                    req.user.logoPath = 'profile_pictures/' + req.user._id + '.jpg';
                                    req.user.save(function(err){
                                        if(err)
                                            console.log(err);
                                    })
                                }
                               
                            });


                       }

                   }
                })
            }
            else if(page_type=='page'){
                req.user.facebookPageInfo = data;
                if(! req.user.uncheckAlert && !req.user.brand.profileInfo.company){
                    req.user.brand.profileInfo.company = data.name;
                }
                var params = {
                    access_token: req.user.facebookAccessToken,
                };
                var url = 'https://graph.facebook.com/' + data.id +'/?fields=picture';
                request.get({  url: url, params: params}, function(err, resp) {
                   if(!err){
                       var body = JSON.parse(resp.body);
                       console.log(body);
                       if(body.picture.data){
                        
                            var uri = body.picture.data.url;
                            request.head(uri, function(err, res, body){

                                // console.log('content-type:', res.headers['content-type']);
                                // console.log('content-length:', res.headers['content-length']);
                                var filename = 'public/profile_pictures/' + req.user._id + '.jpg';
                                request(uri).pipe(fs.createWriteStream(filename));
                                if(req.user.logoPath!=null){
                                    req.user.logoPath = 'profile_pictures/' + req.user._id + '.jpg';
                                    req.user.save(function(err){
                                        if(err)
                                            console.log(err);
                                    })
                                }
                               
                            });


                       }

                   }
                })
            }
            
        }
        else if(channel=='linkedin'){
            req.user.linkedinPostPageType = req.body.page_type;
            if(page_type=='group'){
                console.log('here');
                console.log(data);
                req.user.linkedinGroupInfo = data;
            }
            else if(page_type=='company'){
                console.log('here');
                console.log(data);
                req.user.linkedinCompanyInfo = data;
                if(!req.user.uncheckAlert && !req.user.brand.profileInfo.company){
                    req.user.brand.profileInfo.company = data.name;
                }

            }
        }
        req.user.save(function(err){
            if(err)
                console.log(err);
            else{
                res.send('ok');
                console.log('saved');
            }
        })
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({_id: brandIndex}).exec(function(err,user){
            if(!err && user){
                console.log(user);

                if(channel=='facebook'){
                    user.facebookPostPageType = req.body.page_type;
                    if(page_type=='group'){
                        user.facebookGroupInfo = data;
                        var params = {
                            access_token: user.facebookAccessToken,
                        };
                        var url = 'https://graph.facebook.com/' + data.id +'/?fields=picture';
                        request.get({  url: url, params: params}, function(err, resp) {
                           if(!err){
                               var body = JSON.parse(resp.body);
                               if(body.picture.data){
                                
                                    var uri = body.picture.data.url;
                                    request.head(uri, function(err, res, body){

                                        // console.log('content-type:', res.headers['content-type']);
                                        // console.log('content-length:', res.headers['content-length']);
                                        var filename = 'public/profile_pictures/' + user._id + '.jpg';
                                        request(uri).pipe(fs.createWriteStream('filename'));
                                        if(!user.logoPath){
                                            user.logoPath = 'profile_pictures/' + user._id + '.jpg';
                                            user.save(function(err){
                                                if(err)
                                                    console.log(err);
                                            })
                                        }
                                       
                                    });


                               }

                           }
                        })
                    }
                    else if(page_type=='page'){
                        user.facebookPageInfo = data;
                        var params = {
                            access_token: user.facebookAccessToken,
                        };
                        var url = 'https://graph.facebook.com/' + data.id +'/?fields=picture';
                        request.get({  url: url, params: params}, function(err, resp) {
                           if(!err){
                               var body = JSON.parse(resp.body);
                               if(body.picture.data){
                                
                                    var uri = body.picture.data.url;
                                    request.head(uri, function(err, res, body){

                                        // console.log('content-type:', res.headers['content-type']);
                                        // console.log('content-length:', res.headers['content-length']);
                                        var filename = 'public/profile_pictures/' + user._id + '.jpg';
                                        request(uri).pipe(fs.createWriteStream('filename'));
                                        if(!user.logoPath){
                                            user.logoPath = 'profile_pictures/' + user._id + '.jpg';
                                            user.save(function(err){
                                                if(err)
                                                    console.log(err);
                                            })
                                        }
                                       
                                    });


                               }

                           }
                        })
                    }
                }
                else if(channel=='linkedin'){
                    user.linkedinPostPageType = req.body.page_type;
                    if(page_type=='group'){
                        console.log('here');
                        console.log(data);
                        user.linkedinGroupInfo = data;
                    }
                    else if(page_type=='company'){
                        console.log('here');
                        console.log(data);
                        user.linkedinCompanyInfo = data;
                    }
                }
                user.save(function(err){
                    if(err)
                        console.log(err);
                    else{
                        res.send('ok');
                        console.log('saved');
                    }
                })
            }
        })
    }
}

exports.brandContent = function(req,res){
    console.log('comes here');
    var fg=0;
    var discountText = '';
    adminDiscounts.findOne({'code' : 'current'}).exec(function(err,currentDiscount){
        if(!err){
            // console.log(currentDiscount);
            if(currentDiscount){
                discountText = currentDiscount.discountText;
                // console.log(discountText);

            }
            if(req.user.userType=='agency'){
                var brandIndex = req.param('brandIndex');
                if(brandIndex){
                    req.session.brandIndex = brandIndex;
                }
                else{
                    var brandIndex = req.session.brandIndex;
                }
                User.findOne({
                    '_id': brandIndex
                })
                .exec(function(err,brand){
                    if(!brand.uncheckAlert){
                        brand.uncheckAlert = true;
                        fg=1;
                        brand.save(function(err){
                            if(err)
                                console.log(err);
                        })
                    }
                    // seen blurb index
                    var len = brand.brand.historyWriteBlurb.length;
                    if(len > 0 ){
                        brand.brand.seenBlurbIndex = brand.brand.historyWriteBlurb[len-1]._id;

                    }
                    brand.save(function(err){
                        if(err)
                            console.log(err);
                    })


                    usersBot.findOne({blurbiId: req.user._id}).exec(function(err,userbot){
                       // console.log(user);
                        if(!err && userbot && userbot.historyWriteBlurb){
                           // console.log('user');
                            var len = userbot.brand.historyWriteBlurb.length;

                            if(len > 0 ){
                                len --;

                            }
                                
                            for(var j=0;j<userbot.brand.historyWriteBlurb.length;j++){
                                var blurbId = userbot.brand.historyWriteBlurb[j].blurbId;
                                var find = _.filter(user.brand.historyWriteBlurb,function(item){ return item._id == blurbId});
                                if(find.length > 0){
                                    //console.log(i)
                                    //console.log(find[0].description);
                                    find[0].si = userbot.brand.historyWriteBlurb[j].si;
                                }

                                if(j== len){
                                   
                                    res.render('users/brandContent',{
                                        name: req.user.name,
                                        promoCode: req.user.promoCode,
                                        userType: req.user.userType,
                                        clients: brand.brand.clients,
                                        brandIndex: brandIndex,
                                        brands: req.user.agency.brands,
                                        historyWriteBlurb: brand.brand.historyWriteBlurb,
                                        historyCallAction: brand.brand.historyCallAction,
                                        brandLogoPath: brand.logoPath,
                                        logoPath: req.user.logoPath,
                                        accountBalance: brand.brand.accountBalance,
                                        campaignBalance: brand.brand.campaignBalance,
                                        RequestRecieve: brand.brand.RequestRecieve,
                                        profile: brand.brand.profileInfo,
                                        facebook: brand.facebook,
                                        twitter: brand.twitter,
                                        linkedin: brand.linkedin,
                                        uncheck : fg,
                                        discountText: discountText
                                    })
                                    

                                }
                            }
                           
                        }
                        else{
                                res.render('users/brandContent',{
                                    name: req.user.name,
                                    promoCode: req.user.promoCode,
                                    userType: req.user.userType,
                                    clients: brand.brand.clients,
                                    brandIndex: brandIndex,
                                    brands: req.user.agency.brands,
                                    historyWriteBlurb: brand.brand.historyWriteBlurb,
                                    historyCallAction: brand.brand.historyCallAction,
                                    brandLogoPath: brand.logoPath,
                                    logoPath: req.user.logoPath,
                                    accountBalance: brand.brand.accountBalance,
                                    campaignBalance: brand.brand.campaignBalance,
                                    RequestRecieve: brand.brand.RequestRecieve,
                                    profile: brand.brand.profileInfo,
                                    facebook: brand.facebook,
                                    twitter: brand.twitter,
                                    linkedin: brand.linkedin,
                                    uncheck : fg,
                                    discountText: discountText

                                })

                        }
                        
                    })
         
                })
            }
            else{ //if brand
                if(!req.user.uncheckAlert){
                    req.user.uncheckAlert = true;
                    req.user.save(function(err){
                        if(err)
                            console.log(err);
                    })
                    fg=1;
                }
                var len = req.user.brand.historyWriteBlurb.length-1;
                req.user.brand.seenBlurbIndex = req.user.brand.historyWriteBlurb[len]._id;
                req.user.save(function(err){
                    if(err)
                        console.log(err);
                })
                console.log('and here');
          
                 
                usersBot.findOne({blurbiId: req.user._id}).exec(function(err,userbot){
                   // console.log(user);
                    if(!err && userbot && userbot.historyWriteBlurb){
                       // console.log('user');
                       var len = userbot.brand.historyWriteBlurb.length;

                        if(len > 0 ){
                            len --;

                        }

                        for(var j=0;j<userbot.brand.historyWriteBlurb.length;j++){
                            var blurbId = userbot.brand.historyWriteBlurb[j].blurbId;
                            var find = _.filter(req.user.brand.historyWriteBlurb,function(item){ return item._id == blurbId});
                            if(find.length > 0){
                                //console.log(i)
                                //console.log(find[0].description);
                                find[0].si = userbot.brand.historyWriteBlurb[j].si;
                            }
                            if(j== len){
                               
                                res.render('users/brandContent',{
                                    id: req.user._id,
                                    promoCode: req.user.promoCode,
                                    name: req.user.name,
                                    userType: req.user.userType,
                                    historyWriteBlurb: req.user.brand.historyWriteBlurb,
                                    historyCallAction: req.user.brand.historyCallAction,
                                    logoPath: req.user.logoPath,
                                    accountBalance: req.user.brand.accountBalance,
                                    campaignBalance: req.user.brand.campaignBalance,
                                    RequestRecieve: req.user.brand.RequestRecieve,
                                    facebook: req.user.facebook,
                                    twitter: req.user.twitter,
                                    linkedin: req.user.linkedin,
                                    clients: req.user.brand.clients,
                                    uncheck: fg,
                                    profile: req.user.brand.profileInfo,
                                    discountText: discountText
                                    // BOT INFO
                                    /*botHistoryWriteBlurb: botUser.brand.historyWriteBlurb*/
                                })
                                

                            }
                        }
                       
                    }
                    else{
                            res.render('users/brandContent',{
                                id: req.user._id,
                                promoCode: req.user.promoCode,
                                name: req.user.name,
                                userType: req.user.userType,
                                historyWriteBlurb: req.user.brand.historyWriteBlurb,
                                historyCallAction: req.user.brand.historyCallAction,
                                logoPath: req.user.logoPath,
                                accountBalance: req.user.brand.accountBalance,
                                campaignBalance: req.user.brand.campaignBalance,
                                RequestRecieve: req.user.brand.RequestRecieve,
                                facebook: req.user.facebook,
                                twitter: req.user.twitter,
                                linkedin: req.user.linkedin,
                                clients: req.user.brand.clients,
                                uncheck: fg,
                                profile: req.user.brand.profileInfo,
                                discountText: discountText
                                // BOT INFO
                                /*botHistoryWriteBlurb: botUser.brand.historyWriteBlurb*/
                            })

                    }
                    
                })

                    
            }

        }
    })
   
}
/*custom by roman*/
exports.brandBlurbi = function(req,res){
    var fg=0;
    if(req.user.userType=='agency'){
        var brandIndex = req.param('brandIndex');
        if(brandIndex){
            req.session.brandIndex = brandIndex;
        }
        else{
            var brandIndex = req.session.brandIndex;
        }
        User.findOne({
            '_id': brandIndex
        })
        .exec(function(err,brand){
            if(!brand.uncheckAlert){
                brand.uncheckAlert = true;
                fg=1;
                brand.save(function(err){
                    if(err)
                        console.log(err);
                })
            }
            res.render('users/brandBlurbi',{
                name: req.user.name,
                userType: req.user.userType,
                clients: brand.brand.clients,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                brandLogoPath: brand.logoPath,
                logoPath: req.user.logoPath,
                accountBalance: brand.brand.accountBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                profile: brand.brand.profileInfo,
                facebook: brand.facebook,
                twitter: brand.twitter,
                bufferapp: brand.bufferapp,
                linkedin: brand.linkedin,
                uncheck : fg,
                historyCallAction: brand.brand.historyCallAction,
            })
        })
    }
    else{
        if(!req.user.uncheckAlert){
            req.user.uncheckAlert = true;
            req.user.save(function(err){
                if(err)
                    console.log(err);
            })
            fg=1;
        }
        res.render('users/brandBlurbi',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            facebook: req.user.facebook,
            twitter: req.user.twitter,
            linkedin: req.user.linkedin,
            bufferapp: req.user.bufferapp,
            clients: req.user.brand.clients,
            uncheck: fg,
            historyCallAction: req.user.brand.historyCallAction,
        })
    }
}

exports.writerContent = function(req,res){
    var settag = req.param('settag');
    var brandId = req.param('brandId');
    var brandIndex = req.param('brandIndex');
    var price = req.param('price');
    var ctaId = req.param('ctaId');
    var ctaCount = req.param('ctaCount');
    console.log("price" + ctaId);
    User.find({
        'brand.profileInfo.company' : {
            $ne: null
        }
    }).exec(function(err,user){
    var callOut = new Array();
    for(var i=0;i<user.length;i++)
    {
        for(var j=0;j<user[i].brand.historyCallAction.length;j++)
        {
            // console.log(user[i].brand.historyCallAction[j]);
            if(req.user.writer.clients.indexOf(user[i]._id)!=-1 && user[i].email!='deactivate@blurbi.ca')
                callOut.push({
                    'historyCallAction': user[i].brand.historyCallAction[j], 
                    'logoPath': user[i].logoPath, 
                    'brandId': user[i]._id, 
                    'brandName' : user[i].brand.profileInfo.company, 
                    'date' : user[i].brand.historyCallAction[j].date, 
                    'brandIndex' : user[i].brand.historyCallAction[j].brandIndex
                } );
        }
    }
    if(settag){
            res.render('users/writerCallaction',{
            name: req.user.name,
            userType: req.user.userType,
            accountBalance: req.user.writer.accountBalance,
            clients: req.user.writer.clients,
            historyCallAction: req.user.writer.historyCallAction,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            RequestRecieve: req.user.writer.RequestRecieve,
            writerPerticipated: req.user.writer.writerPerticipated,
            callOut: callOut,
            logoPath: req.user.logoPath,
            userId: req.user._id,
            settag: settag,
            brandId: brandId,
            clients: req.user.writer.clients,
            brandIndex: brandIndex,
            price: price,
            ctaId: ctaId,
            ctaCount:ctaCount
        })
    }
    else{
        console.log("ctaCount is : "+ctaCount);
            res.render('users/writerCallaction',{
            name: req.user.name,
            userType: req.user.userType,
            accountBalance: req.user.writer.accountBalance,
            clients: req.user.writer.clients,
            historyCallAction: req.user.writer.historyCallAction,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            RequestRecieve: req.user.writer.RequestRecieve,
            writerPerticipated: req.user.writer.writerPerticipated,
            callOut: callOut,
            logoPath: req.user.logoPath,
            userId: req.user._id,
            clients: req.user.writer.clients,
            ctaCount: ctaCount
        })
    }
})
}
exports.writeBlurbs = function(req,res){
    var tag=req.param('settag');
    // console.log(tag);
    var expiredate = req.param('expiredate');
    var brandId = req.param('brandId');
    var price = req.param('price');
    var brandIndex = req.param('brandIndex');
    var ctaId = req.param('ctaId');
    if(!ctaId)
        ctaId = null;
    var brands = new Array();
    User.find({$and: [{ 'brand.profileInfo.company': { $ne: null } }, {'email' : { $ne: 'deactivate@blurbi.ca'}}]}).exec(function(err,user){
    // console.log(user);
    for(var i=0;i<user.length;i++)
    {
        brands.push({
            'company': user[i].brand.profileInfo.company, 
            'id' : user[i]._id
            });
    }
    // console.log(brands);
    if(tag){
        res.render('users/writeBlurbs',{
            name: req.user.name,
            userType: req.user.userType,
            accountBalance: req.user.writer.accountBalance,
            clients: req.user.writer.clients,
            historyCallAction: req.user.writer.historyCallAction,
            historyWriteblurb: req.user.writer.historyWriteBlurb,
            RequestRecieve: req.user.writer.RequestRecieve,
            brands: brands,
            settag: tag,
            expiredate: expiredate,
            price: price,
            brandIndex: brandIndex,
            brandId: brandId,
            logoPath: req.user.logoPath,
            ctaId: ctaId
        })
    }
    else{
        res.render('users/writeBlurbs',{
            name: req.user.name,
            userType: req.user.userType,
            accountBalance: req.user.writer.accountBalance,
            clients: req.user.writer.clients,
            historyCallAction: req.user.writer.historyCallAction,
            historyWriteblurb: req.user.writer.historyWriteBlurb,
            RequestRecieve: req.user.writer.RequestRecieve,
            brands: brands,
            logoPath: req.user.logoPath
        })
    }
})
}
exports.callAction = function(req,res){
    if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id': brandIndex
        })
        .exec(function(err,brand){
            res.render('users/callAction',{
                name: req.user.name,
                userType: req.user.userType,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                historyCallAction: brand.brand.historyCallAction,
                brandLogoPath: brand.logoPath,
                logoPath: req.user.logoPath,
                accountBalance: brand.brand.accountBalance,
                campaignBalance: req.user.brand.campaignBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                profile: brand.brand.profileInfo,
                clients: brand.brand.clients,
                pricePerBlurb: brand.brand.pricePerBlurb,
                pricePerResponse: req.user.brand.pricePerResponse
            })
        })
    }
    else{
        console.log("account balance : " + req.user.brand.campaignBalance);
        res.render('users/callAction',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            campaignBalance: req.user.brand.campaignBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            historyCallAction: req.user.brand.historyCallAction,
            pricePerBlurb: req.user.brand.pricePerBlurb,
            pricePerResponse: req.user.brand.pricePerResponse
        })
    }
}
exports.analytics = function(req,res){
    if(req.user.userType=='brand')
    {
        res.render('users/analytics',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            campaignBalance:req.user.brand.campaignBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            startingDate: req.user.startingDate,
            twitterFollowersCount: req.user.brand.twitterFollowersCount,
            facebookSubscribersCount: req.user.brand.facebookSubscribersCount,
            linkedinFollowersCount: req.user.brand.linkedinFollowersCount,
            historyCallAction: req.user.brand.historyCallAction
        })
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id': brandIndex
        })
        .exec(function(err,brand){
            res.render('users/analytics',{
                name: req.user.name,
                userType: req.user.userType,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                logoPath: req.user.logoPath,
                brandLogoPath: brand.logoPath,
                accountBalance: brand.brand.accountBalance,
                campaignBalance:req.user.brand.campaignBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                profile: brand.brand.profileInfo,
                clients: brand.brand.clients,
                historyCallAction: brand.brand.historyCallAction
            })
        })
    }
    else if(req.user.userType=='writer')
    {
        res.render('users/writerAnalytics',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            historyCallAction: req.user.writer.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.writer.accountBalance,
            RequestRecieve: req.user.writer.RequestRecieve,
            clients: req.user.writer.clients
        })
    }
}



exports.deleteCallToAction = function(req,res){
    console.log(req.body);

    if(req.user.userType == 'brand'){
        var find=_.filter(req.user.brand.historyCallAction,function(item){return item._id == req.body.deleteCtaId});
       
        if(find.length>0){
            find[0].deleteStatus = 'deleted';

            req.user.save(function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log('deleted done');
                    res.send();
                }
            });
        }

    }


    if(req.user.userType == 'agency'){

        var brandId = req.session.brandIndex;        

        User.findOne({'_id':brandId}).exec(function(err,brand){
            if(brand){

                var find=_.filter(brand.brand.historyCallAction,function(item){return item._id == req.body.deleteCtaId});
                
                if(find.length>0){
                    find[0].deleteStatus = 'deleted';

                    brand.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            console.log('deleted done');
                            res.send();
                        }
                    });
                }

            }else{
                console.log(err);
            }
        });
    }


}



exports.editCallToAction = function(req,res){
    console.log('entering the site');

    console.log(req.body);


    var file;
    var datepicker = new Date(req.body.datepicker1);
    var timepicker = req.body.timepicker1;
    if(!req.body.datepicker1){
        datepicker = "";
    }else{
        if(req.body.timepicker1){
            var addHour = 0;
            if(timepicker.indexOf("pm")!=-1){
                addHour = 12;
            }
            var hourMinute = timepicker.split(":");
            var hour = parseInt(hourMinute[0]) + parseInt(addHour);
            var minute = hourMinute[1].split(" ");
            datepicker.setHours(hour);
            datepicker.setMinutes(minute[0]);
           /* console.log(datepicker);*/
        }
    }
    var datepicker2 = new Date(req.body.datepicker2);
    var timepicker2 = req.body.timepicker2;
    if(!req.body.datepicker2){
        datepicker2 = "";
    }
    else{
        if(req.body.timepicker2){
            var addHour = 0;
            if(timepicker2.indexOf("pm")!=-1){
                addHour = 12;
            }
            var hourMinute = timepicker2.split(":");
            var hour = parseInt(hourMinute[0]) + parseInt(addHour);
            var minute = hourMinute[1].split(" ");
            datepicker2.setHours(hour);
            datepicker2.setMinutes(minute[0]);
        }
    }
    var filePath = '';

   
    if(req.files.fileData.path){
        var file = req.files;
        fs.readFile(req.files.fileData.path, function (err, data) {
            if(req.files.fileData.name){
                fs.writeFile('public/uploadedFiles/'+ req.user._id + req.files.fileData.name ,data, function (err) {
                    if (err) throw err;
                      fs.unlink(req.files.fileData.path, function (err){
                          if (err)
                             throw err;
                          else
                          {
                            console.log('file deleted');

                          }
                        }); 
                });
            }
        });
        if(file.fileData.name){
            filePath = 'uploadedFiles/'+ req.user._id + file.fileData.name ;
        }else{
            filePath = '';
        }
        console.log("filepath : "+filePath);
    }


    console.log('datepicer : '+datepicker);
    console.log('datepiker : '+datepicker2);


    if(req.user.userType == 'brand'){

        var find=_.filter(req.user.brand.historyCallAction,function(item){return item._id == req.body.editCtaId});
        console.log(find);

        if(find.length>0){

            find[0].title = req.body.editTitle;
            find[0].description = req.body.editDescription;
            find[0].eventType = req.body.editEvents;
            find[0].datepicker = datepicker;
            find[0].startDatepicker = datepicker2;
            /*find[0].price = req.body.editPrice;*/
            find[0].editStatus = 'Yes';


            req.user.save(function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log('done edit');
                }
            });

        }



        if(req.user.brand.clients.length>0){
            //console.log('entering');
            User.find({
                'writer.profileInfo.name': {
                    $ne: null
                }
            }).where('_id').in(req.user.brand.clients).exec(function(err,clients){

                if(clients){
                    console.log('length: '+clients.length);
                    for(var i=0; i<clients.length; i++){
                        console.log(clients[i].writer.historyCallAction.length);
                        var find=_.filter(clients[i].writer.historyCallAction,function(item){return item.brandCallId == req.body.editCtaId});
                        console.log(find);

                        if(find.length>0){
                            find[0].editStatus = "Yes";
                            find[0].title = req.body.editTitle;
                            find[0].description = req.body.editDescription;
                            find[0].eventType = req.body.editEvents;
                            find[0].datepicker = datepicker;
                            find[0].startDatepicker = datepicker2;
                            find[0].price = req.body.editPrice;
                           

                            clients[i].save(function(err){
                                if(err){
                                    console.log(err)
                                }else{
                                    console.log('done saved');
                                }
                            });
                        }
                    }
                }
            
            });
        }



    }



    if(req.user.userType == 'agency'){
        var brandId = req.session.brandIndex;

        User.findOne({'_id':brandId}).exec(function(err,brand){

            if(brand){


                var find=_.filter(brand.brand.historyCallAction,function(item){return item._id == req.body.editCtaId});
                console.log(find);

                if(find.length>0){

                    find[0].title = req.body.editTitle;
                    find[0].description = req.body.editDescription;
                    find[0].eventType = req.body.editEvents;
                    find[0].datepicker = datepicker;
                    find[0].startDatepicker = datepicker2;
                    find[0].price = req.body.editPrice;


                    brand.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            console.log('done edit');
                        }
                    });

                }




                if(brand.brand.clients.length>0){
                console.log('entering');
                User.find({
                    'writer.profileInfo.name': {
                        $ne: null
                    }
                }).where('_id').in(brand.brand.clients).exec(function(err,clients){

                    if(clients){
                        console.log('length: '+clients.length);
                        for(var i=0; i<clients.length; i++){
                            console.log('ctalen '+ clients[i].writer.historyCallAction.length);
                            console.log('id: '+req.body.editCtaId);
                            var find=_.filter(clients[i].writer.historyCallAction,function(item){return item.brandCallId == req.body.editCtaId});
                            console.log(find);

                            if(find.length>0){
                                find[0].editStatus = "Yes";
                                find[0].title = req.body.editTitle;
                                find[0].description = req.body.editDescription;
                                find[0].eventType = req.body.editEvents;
                                find[0].datepicker = datepicker;
                                find[0].startDatepicker = datepicker2;
                                find[0].price = req.body.editPrice;
                               

                                clients[i].save(function(err){
                                    if(err){
                                        console.log(err)
                                    }else{
                                        console.log('done saved');
                                    }
                                });
                            }
                        }
                    }
                
                });
            }



                
            }else{
                console.log(err);
            }

        });
    }



    
    res.redirect('/users/callAction');
}




exports.callActionPost=function(req,res){
    // console.log("req body of callaction");

    console.log(req.body);


    var file;
    var datepicker = new Date(req.body.datepicker1);
    var timepicker = req.body.timepicker1;
    if(!req.body.datepicker1)
    {
        datepicker = "";
    }
    else
    {
        if(req.body.timepicker1){
            var addHour = 0;
            if(timepicker.indexOf("pm")!=-1){
                addHour = 12;
            }
            var hourMinute = timepicker.split(":");
            var hour = parseInt(hourMinute[0]) + parseInt(addHour);
            var minute = hourMinute[1].split(" ");
            datepicker.setHours(hour);
            datepicker.setMinutes(minute[0]);
           /* console.log(datepicker);*/
        }
    }
    var datepicker2 = new Date(req.body.datepicker2);
    var timepicker2 = req.body.timepicker2;
    if(!req.body.datepicker2)
    {
        datepicker2 = "";
    }
    else
    {
        if(req.body.timepicker2){
            var addHour = 0;
            if(timepicker2.indexOf("pm")!=-1){
                addHour = 12;
            }
            var hourMinute = timepicker2.split(":");
            var hour = parseInt(hourMinute[0]) + parseInt(addHour);
            var minute = hourMinute[1].split(" ");
            datepicker2.setHours(hour);
            datepicker2.setMinutes(minute[0]);
        }
    }
    var filePath = '';

    /*write files */
    if(req.files.fileData.path){
        var file = req.files;
        fs.readFile(req.files.fileData.path, function (err, data) {
            if(req.files.fileData.name){
                fs.writeFile('public/uploadedFiles/'+ req.user._id + req.files.fileData.name ,data, function (err) {
                    if (err) throw err;
                      fs.unlink(req.files.fileData.path, function (err){
                          if (err)
                             throw err;
                          else
                          {
                            console.log('file deleted');

                          }
                        }); 
                });
            }
        });
        if(file.fileData.name){
            filePath = 'uploadedFiles/'+ req.user._id + file.fileData.name ;
        }else{
            filePath = '';
        }
        console.log("filepath : "+filePath);
    }
    /*end save save files in storage*/
    if(req.user.userType=='agency'){
        var brandId = req.session.brandIndex;
        User.findOne({
            '_id' :brandId
        }).exec(function(err,user){
            var date = new Date();
            var brandIndex = user.brand.historyCallAction.length;
            user.brand.historyCallAction.push({
                'title': req.body.title, 
                'description': req.body.description, 
                'projectBrief': req.body.projectBrief, 
                'datepicker' : datepicker, 
                'startDatepicker' : datepicker2,
                'date' : date, 
                'price' : user.brand.pricePerBlurb, 
                'eventType' : req.body.events,
                'status' : 'Pending', 
                'seen' : 'unseen',
                'filePath' : filePath
            });
            user.save(function (err)
            {
                if (err) // TODO handle the error
                    console.log("error in insertion "+err);
            //else
            //console.log(req.user.historyCallAction);
            });
            if(user.brand.clients.length>0)
            {
                //console.log('entering');
                User.find({
                    'writer.profileInfo.name': {
                        $ne: null
                    }
                }).where('_id').in(user.brand.clients).exec(function(err,clients){
                if(!err)
                {   
                    console.log('agencycallid'+user.brand.historyCallAction[user.brand.historyCallAction.length-1]._id);
                    for(var i=0;i<clients.length;i++)
                    {  
                        clients[i].writer.historyCallAction.push({
                            'id': user._id, 
                            'logoPath': user.logoPath,
                            'brand': {
                                'company' : user.brand.profileInfo.company
                                }, 
                            'title': req.body.title,
                            'description': req.body.description,
                            'projectBrief': req.body.projectBrief,  
                            'datepicker' : datepicker, 
                            'startDatepicker' : datepicker2,
                            'date' : date, 
                            'price' : req.body.price, 
                            'status' : 'Pending', 
                            'seen' : 'unseen',
                            'brandCallId': user.brand.historyCallAction[user.brand.historyCallAction.length-1]._id
                        })
                        clients[i].save(function(err){
                            if(err) console.log(err);
                        });
                    } 
                }
            });
        }
        res.redirect('/users/callAction');
        })
    }
    else{
        var date = new Date();
        var brandIndex = req.user.brand.historyCallAction.length;
        req.user.brand.historyCallAction.push({
            'title': req.body.title, 
            'description': req.body.description,
            'projectBrief': req.body.projectBrief, 
            'datepicker' : datepicker, 
            'startDatepicker' : datepicker2,
            'date' : date, 
            'price' : req.user.brand.pricePerBlurb,
            'perResponse': req.body.pricePerResponse, 
            'eventType' : req.body.events,
            'brandIndex' : brandIndex, 
            'status' : 'Pending', 
            'seen' : 'unseen',
            'filePath' : filePath
        });
        req.user.save(function (err)
        {
            if (err) // TODO handle the error
                console.log("error in insertion "+err);
        //else
        //console.log(req.user.historyCallAction);
        });
        if(req.user.brand.clients.length>0)
        {
            //console.log('entering');
            User.find({
                'writer.profileInfo.name': {
                    $ne: null
                }
            }).where('_id').in(req.user.brand.clients).exec(function(err,clients){
            if(!err)
            {
                for(var i=0;i<clients.length;i++)
                {  
                    console.log('ctaId : ' + req.user.brand.historyCallAction[req.user.brand.historyCallAction.length-1]._id);
                    clients[i].writer.historyCallAction.push({
                        'id': req.user._id, 
                        'logoPath': req.user.logoPath,
                        'brand': {
                            'company' : req.user.brand.profileInfo.company
                            }, 
                        'title': req.body.title,
                        'description': req.body.description, 
                        'projectBrief': req.body.projectBrief, 
                        'datepicker' : datepicker, 
                        'startDatepicker' : datepicker2,
                        'date' : date, 
                        'price' : req.body.price, 
                        'status' : 'Pending', 
                        'seen' : 'unseen',
                        'filePath' : filePath,
                        'brandCallId': req.user.brand.historyCallAction[req.user.brand.historyCallAction.length-1]._id
                    })
                    clients[i].save(function(err){
                        if(err) console.log(err);
                    });
                } 
            }
        });
    }
        res.redirect('/users/callAction');
    }
}
exports.TopUpAccount = function(req,res){
    console.log("call to action page :"+req.user.enterpriseAddress);
    
  
   console.log( req.user.admin.invoiceIndexNo);


    var env;
    if(process.env.NODE_ENV){
        env = 'development';
    }
    else{
        env = 'production';
    }
    if(req.user.userType=='brand')
    {
        res.render('users/TopUpAccount',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            historyCallAction: req.user.brand.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            campaignBalance: req.user.brand.campaignBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            brandType: {brandType:req.user.brandType},
            enterpriseAddress: {enterpriseAddress:req.user.enterpriseAddress},
            env : { env: env},
            profileInfo: req.user.brand.profileInfo,
            invoiceIndexNo: req.user.admin.invoiceIndexNo 
           
        })
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id': brandIndex
        })
        .exec(function(err,brand){
            res.render('users/TopUpAccount',{
                name: req.user.name,
                userType: req.user.userType,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                historyCallAction: brand.brand.historyCallAction,
                brandLogoPath: brand.logoPath,
                logoPath: req.user.logoPath,
                accountBalance: brand.brand.accountBalance,
                campaignBalance: brand.brand.campaignBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                profile: brand.brand.profileInfo,
                clients: brand.brand.clients,
                brandType: {brandType:'brand'},
                enterpriseAddress: {enterpriseAddress:'enterprise'},

                /*name: {name: 'name'},*/
                env : { env: env},
                invoiceIndexNo: req.user.admin.invoiceIndexNo 

        })
    })
  }

    else if(req.user.userType=='writer'){
        res.render('users/writerdeposit',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            historyCallAction: req.user.writer.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.writer.accountBalance,
            RequestRecieve: req.user.writer.RequestRecieve,
            clients: req.user.writer.clients
        })
    }
}
exports.changePricing = function(req,res){
    console.log("take a look : " + req.body);
    if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id' : brandIndex
        }).exec(function(err,brand){
            res.render('users/changepricing',{
                id: brand._id,
                name: req.user.name,
                userType: req.user.userType,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                historyCallAction: brand.brand.historyCallAction,
                brandLogoPath: brand.logoPath,
                logoPath: req.user.logoPath,
                accountBalance: brand.brand.accountBalance,
                campaignBalance: req.user.brand.campaignBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                clients: brand.brand.clients,
                pricePerBlurb: brand.brand.pricePerBlurb,
                pricePerResponse: req.user.brand.pricePerResponse,
                profile: brand.brand.profileInfo,
                brands: req.user.agency.brands
            })
        })
    }
    else{
        res.render('users/changepricing',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            historyCallAction: req.user.brand.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            campaignBalance: req.user.brand.campaignBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            pricePerBlurb: req.user.brand.pricePerBlurb,
            pricePerResponse: req.user.brand.pricePerResponse
        })
    }
}


exports.browseClients = function(req,res){
   /* console.log(req.user.writer[0].lastLogin);*/
    
    if(req.user.userType=='writer'){
        var status;
        var fg=0;
        var acceptance;
        var brands = new Array();
        var enterprises = new Array();
        User.find({$and: [{'brand.profileInfo.company': { $ne: null }}, {'email' : { $ne: 'deactivate@blurbi.ca'}}]}).exec(function(err,user){
            for(var i=0;i<user.length;i++){
                (function(i){
                    usersBot.findOne({blurbiId: user[i]._id}).exec(function(err,blurbiBrand){
                        acceptance = 0;
                        for(var j=0;j<user[i].brand.historyWriteBlurb.length;j++){
                            if(user[i].brand.historyWriteBlurb[j].status=='Accepted')
                            {
                                acceptance++;
                            }
                        }

                        if(user[i].brand.historyWriteBlurb.length>0)
                            acceptance = Math.floor((acceptance/user[i].brand.historyWriteBlurb.length)*100)

                        if(!err && blurbiBrand){
                            var updatedTotalSiIndex = blurbiBrand.brand.totalSI.length;
                            var si;
                            if(updatedTotalSiIndex > 0){
                                updatedTotalSiIndex -=1;
                                si = blurbiBrand.brand.totalSI[updatedTotalSiIndex].count;
                            }
                            else{
                                si = 0;
                            }

                            brands.push({
                                'profileInfo': user[i].brand.profileInfo, 
                                'id' : user[i]._id, 
                                'logoPath' : user[i].logoPath, 
                                'acceptance' : acceptance, 
                                'pricePerBlurb' : user[i].brand.pricePerBlurb,
                                'historyWriteBlurb': user[i].brand.historyWriteBlurb,
                                'lastLogin' : user[i].lastLogin,
                                'si' : si
                            });
                            if(req.user.writer.clients.indexOf(user[i]._id)!=-1){
                                enterprises.push({
                                    'profileInfo': user[i].brand.profileInfo, 
                                    'id' : user[i]._id, 
                                    'logoPath' : user[i].logoPath, 
                                    'acceptance' : acceptance, 
                                    'pricePerBlurb' : user[i].brand.pricePerBlurb,
                                    'historyWriteBlurb': user[i].brand.historyWriteBlurb,
                                    'lastLogin' : user[i].lastLogin,
                                    'si' : si
                                });
                            }

                        }else{

                            brands.push({
                                'profileInfo': user[i].brand.profileInfo, 
                                'id' : user[i]._id, 
                                'logoPath' : user[i].logoPath, 
                                'acceptance' : acceptance, 
                                'pricePerBlurb' : user[i].brand.pricePerBlurb,
                                'historyWriteBlurb': user[i].brand.historyWriteBlurb,
                                'lastLogin' : user[i].lastLogin,
                                'si' : 0
                            });

                            if(req.user.writer.clients.indexOf(user[i]._id)!=-1){
                                enterprises.push({
                                    'profileInfo': user[i].brand.profileInfo, 
                                    'id' : user[i]._id, 
                                    'logoPath' : user[i].logoPath, 
                                    'acceptance' : acceptance, 
                                    'pricePerBlurb' : user[i].brand.pricePerBlurb,
                                    'historyWriteBlurb': user[i].brand.historyWriteBlurb,
                                    'lastLogin' : user[i].lastLogin,
                                    'si' : 0
                                });
                            }

                        }

                        if(brands.length == user.length){
                            if(req.user.writerType=='internal'){

                                res.render('users/writerBrowseClients',{
                                    name: req.user.name,
                                    userType: req.user.userType,
                                    accountBalance: req.user.writer.accountBalance,
                                    clients: req.user.writer.clients,
                                    historyWriteBlurb: req.user.writer.historyWriteBlurb,
                                    historyCallAction: req.user.writer.historyCallAction,
                                    RequestRecieve: req.user.writer.RequestRecieve,
                                    RequestSend: req.user.writer.RequestSend,
                                    writerPerticipated: req.user.writer.writerPerticipated,
                                    brands: enterprises,
                                    logoPath: req.user.logoPath,
                                    writerType: req.user.writerType
                                })

                            }else{

                                res.render('users/writerBrowseClients',{
                                    name: req.user.name,
                                    userType: req.user.userType,
                                    accountBalance: req.user.writer.accountBalance,
                                    clients: req.user.writer.clients,
                                    historyWriteBlurb: req.user.writer.historyWriteBlurb,
                                    historyCallAction: req.user.writer.historyCallAction,
                                    RequestRecieve: req.user.writer.RequestRecieve,
                                    RequestSend: req.user.writer.RequestSend,
                                    writerPerticipated: req.user.writer.writerPerticipated,
                                    brands: brands,
                                    logoPath: req.user.logoPath,
                                    writerType: 'external'
                                })
                                
                            }

                        }
                    })
                })(i)
            }
        })
    }
}




exports.settings = function(req,res){
    if(req.user.userType=='brand'){
        res.render('users/settings',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            historyCallAction: req.user.brand.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            campaignBalance:req.user.brand.campaignBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            pricePerBlurb: req.user.brand.pricePerBlurb,
            emailSettings: req.user.brand.emailSettings,
            facebook: req.user.facebook,
            twitter: req.user.twitter,
            bufferapp: req.user.bufferapp,
            linkedin: req.user.linkedin,
            email: req.user.email
        })
    }
    else if(req.user.userType=='writer'){
        res.render('users/writerSettings',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyCallAction: req.user.writer.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.writer.accountBalance,
            RequestRecieve: req.user.writer.RequestRecieve,
            clients: req.user.writer.clients,
            pricePerBlurb: req.user.writer.pricePerBlurb,
            emailSettings: req.user.writer.emailSettings,
            facebook: req.user.facebook,
            twitter: req.user.twitter,
            bufferapp: req.user.bufferapp,
            linkedin: req.user.linkedin,
            email: req.user.email
        })
    }
    else if(req.user.userType=='agency'){
        res.render('users/agencySettings',{
            name: req.user.name,
            userType: req.user.userType,
            logoPath: req.user.logoPath,
            brands: req.user.agency.brands,
            emailSettings: req.user.agency.emailSettings,
            valid: req.user.valid,
            email: req.user.email
        })
    }
}
exports.agencyBrandProfile = function(req,res){
    console.log('seema seema');
    var brandIndex = req.param('brandIndex');
    var acceptance = 0;
    var facebook = null;
    var twitter = null;
    var linkedin = null;
    if(brandIndex)
        req.session.brandIndex = brandIndex;
    else
        var brandIndex = req.session.brandIndex;
    User.findOne({
        '_id': brandIndex
    })
    .exec(function(err,brand){
       


        if(brand.brand.historyWriteBlurb.length>0)
            acceptance = Math.floor((acceptance/brand.brand.historyWriteBlurb.length)*100);
            if(brand.facebook!=null){
                if(brand.facebookPostPageType=='profile'){
                    facebook = brand.facebook.link;
                }
                else if(brand.facebookPostPageType=='page'){
                    facebook = "https://www.facebook.com/pages/" + brand.facebookPageInfo.name + "/" + brand.facebookPageInfo.id;
                }
                else{
                    facebook = "https://www.facebook.com/groups/" + brand.facebookGroupInfo.id;
                }
               
            }
            if(brand.twitter!=null)
                twitter = brand.twitter.screen_name;
            if(brand.linkedin!=null){
                if(brand.linkedinPostPageType=='profile'){
                    linkedin = brand.linkedin.publicProfileUrl;
                }
                else if(brand.linkedinPostPageType=='group'){
                    linkedin = 'http://www.linkedin.com/groups/'+ brand.linkedinGroupInfo.group.name + '-' + brand.linkedinGroupInfo.group.id;
                }
                else{
                    linkedin = 'http://www.linkedin.com/company/' + brand.linkedinCompanyInfo.id;
                }
               
            }


        res.render('users/agencyBrandProfile',{
            name: req.user.name,
            userType: req.user.userType,
            brandIndex: brandIndex,
            brands: req.user.agency.brands,
            historyWriteBlurb: brand.brand.historyWriteBlurb,
            agencyHistoryWriteBlurb: brand.brand.historyWriteBlurb,
            historyCallAction: brand.brand.historyCallAction,
            agencyHistoryCallAction: brand.brand.historyCallAction,
            logoPath: req.user.logoPath,
            brandLogoPath: brand.logoPath,
            accountBalance: brand.brand.accountBalance,
            campaignBalance: brand.brand.campaignBalance,
            RequestRecieve: brand.brand.RequestRecieve,
            profile: brand.brand.profileInfo,
            clients: brand.brand.clients,
            facebook: facebook,
            twitter: twitter,
            linkedin: linkedin,
            acceptance: acceptance,
            improveProfile: brand.brand.improveProfile
        })
    })
}
exports.getProfile = function(req,res){
    var acceptance = 0;
    var facebook = null;
    var twitter = null;
    var linkedin = null;
    var facebook_followers_count = 0;
    var twitter_followers_count = 0;
    var linkedin_followers_count = 0;
    if(req.user.userType=='brand'){
        for(var i=0;i<req.user.brand.historyWriteBlurb.length;i++)
        {
            if(req.user.brand.historyWriteBlurb[i].status=='Accepted')
            {
                acceptance++;
            // console.log(req.user.brand.historyCallAction[i].status);
            }
        }
        if(req.user.brand.historyWriteBlurb.length>0)
            acceptance = Math.floor((acceptance/req.user.brand.historyWriteBlurb.length)*100);
         if(req.user.facebook!=null){
            if(req.user.facebookPostPageType=='profile'){
                facebook = req.user.facebook.link;
            }
            else if(req.user.facebookPostPageType=='page'){
                facebook = "https://www.facebook.com/pages/" + req.user.facebookPageInfo.name + "/" + req.user.facebookPageInfo.id;
            }
            else{
                facebook = "https://www.facebook.com/groups/" + req.user.facebookGroupInfo.id;
            }
           
        }
        if(req.user.twitter!=null)
            twitter = req.user.twitter.screen_name;
        if(req.user.linkedin!=null){
            if(req.user.linkedinPostPageType=='profile'){
                linkedin = req.user.linkedin.publicProfileUrl;
            }
            else if(req.user.linkedinPostPageType=='group'){
                linkedin = 'http://www.linkedin.com/groups/'+ req.user.linkedinGroupInfo.group.name + '-' + req.user.linkedinGroupInfo.group.id;
            }
            else{
                linkedin = 'http://www.linkedin.com/company/' + req.user.linkedinCompanyInfo.id;
            }
           
        }
        usersBot.findOne({'blurbiId' : req.user._id}).exec(function(err,botUser){
            if(!err && botUser){
                var len_fb = botUser.brand.facebookSubscribersCount.length;
                var len_twt = botUser.brand.twitterFollowersCount.length;
                var len_link = botUser.brand.linkedinFollowersCount.length;

                if(len_fb > 0){
                    len_fb --;
                    facebook_followers_count = botUser.brand.facebookSubscribersCount[len_fb].count;

                }
                if(len_twt > 0){
                    len_twt --;
                    twitter_followers_count = botUser.brand.twitterFollowersCount[len_twt].count;

                }
                if(len_link > 0){
                    len_link --;
                    linkedin_followers_count = botUser.brand.linkedinFollowersCount[len_link].count;

                }
            }
            res.render('users/testProfile',{
                id: req.user._id,
                name: req.user.name,
                userType: req.user.userType,
                historyWriteBlurb: req.user.brand.historyWriteBlurb,
                brandHistoryWriteBlurb: req.user.brand.historyWriteBlurb,
                historyCallAction: req.user.brand.historyCallAction,
                brandHistoryCallAction: req.user.brand.historyCallAction,
                improveProfile: req.user.brand.improveProfile,
                logoPath: req.user.logoPath,
                brandLogoPath: req.user.logoPath,
                accountBalance: req.user.brand.accountBalance,
                campaignBalance: req.user.brand.campaignBalance,
                RequestRecieve: req.user.brand.RequestRecieve,
                clients: req.user.brand.clients,
                pricePerBlurb: req.user.brand.pricePerBlurb,
                profile: req.user.brand.profileInfo,
                facebook: facebook,
                twitter: twitter,
                linkedin: linkedin,
                acceptance: acceptance,
                facebook_followers_count: facebook_followers_count,
                twitter_followers_count: twitter_followers_count,
                linkedin_followers_count: linkedin_followers_count
            })
        })
 
    }
    else if(req.user.userType=='writer'){
        for(var i=0;i<req.user.writer.historyWriteBlurb.length;i++)
        {
            if(req.user.writer.historyWriteBlurb[i].status=='Accepted')
                acceptance++;
        }
        if(req.user.writer.historyWriteBlurb.length>0)
            acceptance = Math.floor((acceptance/req.user.writer.historyWriteBlurb.length)*100);
        res.render('users/writerProfile',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            historyCallAction: req.user.writer.historyCallAction,
            logoPath: req.user.logoPath,
            writerLogoPath: req.user.logoPath,
            accountBalance: req.user.writer.accountBalance,
            RequestRecieve: req.user.writer.RequestRecieve,
            clients: req.user.writer.clients,
            pricePerBlurb: req.user.writer.pricePerBlurb,
            writerProfile: req.user.writer.profileInfo,
            acceptance: acceptance,
            joiningDate: req.user.joiningDate
        })
    }
    else if(req.user.userType=='agency'){
     
        res.render('users/agencyprofile',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            profile: req.user.agency.profileInfo,
            logoPath: req.user.logoPath,
            brands: req.user.agency.brands,
            valid: req.user.valid,
            facebook: req.user.facebook,
            twitter: req.user.twitter,
            linkedin: req.user.linkedin
        })
    }
}
exports.writerRegistrationPost  = function(req,res){
  if(req.body.writerInfo)
  {
      if(req.session.writer_email && req.session.writer_name && req.session.password){
        User.findOne({'email':'helloblurbi@blurbi.ca'}).exec(function(err,user){
                if(user){
                  var len = user.admin.writerRequest.length;
                  user.admin.writerRequest.push({'name': req.session.writer_name, 'email': req.session.writer_email, 'password' : req.session.password});
                  user.admin.writerRequest[len].writerProfile = req.body;
                  var writer = new User({'email' : req.session.writer_email});
                  writer.save(function(err){
                    if(err)
                      console.log(err);
                  })                  
                  user.save(function(err){
                    if(err)
                      console.log(err);
                  })
                  req.session.writer_email = null;
                  req.session.writer_name = null;
                  req.session.password = null;
              }
            })
           res.redirect('/writerRegistrationSuccess');        
      }
      else{
          res.redirect('/usersignup')
      }
  }
}
exports.writerRegistrationSuccess = function(req,res){
    res.render('writerRegistrationSuccess');
}
exports.adminPage = function(req,res){
    res.render('users/adminPage',{
        user: req.user,
        userType: req.user.userType
    })
}
exports.writerRegistrationAccept = function(req,res){
    //console.log(req.user);
    //console.log(req.body);
    var change_password_link;
    var login_link;
    if(process.env.NODE_ENV){
        change_password_link = "https://localhost/users/redirectChangePassword";
        login_link = "https://localhost/users/redirectLogin"
    }
    else{
        change_password_link = "https://blurbi.ca/users/redirectChangePassword";
        login_link = "https://blurbi.ca/users/redirectLogin"
    }
    var id = req.body.id;
    console.log(id);
    var writerId = req.user.admin.writerRequest[id]._id;
    var email = req.user.admin.writerRequest[id].email;
    var name = req.user.admin.writerRequest[id].name;
    var pass = req.user.admin.writerRequest[id].password;
    //console.log(name);
    //console.log(email);
    User.findOne({
        'email':email
    }).exec(function(err,user){
        if(user)
        {
            user.name = name;
            if(!pass)
                pass=generatePassword();
            user.setPassword(pass);
            user.userType="writer";
            user.writer.emailSettings = ['SiteActions','SiteNews','HelpfulStuff'] ;
            user.writer.profileInfo = req.user.admin.writerRequest[id].writerProfile;
            var today=new Date();
            today=today.toDateString();
            user.joiningDate= today;
            //console.log(req.user.admin.writerRequest[id].writerProfile);
            var interest = req.user.admin.writerRequest[id].writerProfile.interest;
            interest = interest.replace(/\s+/g, '').trim().split(',');
            var interests_mapping = interestMapping.get_interest_mapping();
            for(var i=0;i<interest.length;i++){
                if(interest[i]){
                    // console.log('interest');
                    // console.log(interest[i]);
                    var find = _.findWhere(interests_mapping,{'interest_name' : interest[i]});
                    var option_name = '';
                    if(find)
                        option_name = find.option_name;
                    user.interestList.push({'interest_name' : interest[i], 'option_name': option_name});

                }

            }
            user.save(function(err){
                if(err)
                    console.log(err);
            })
            autoMatch(user._id, interest);
         
            console.log(pass);
            if(req.user.admin.writerRequest[id].facebook){
                user.facebook = req.user.admin.writerRequest[id].facebook;
                user.facebookAccessToken = req.user.admin.writerRequest[id].facebookAccessToken;
            }
            if(req.user.admin.writerRequest[id].twitter){
                user.twitter = req.user.admin.writerRequest[id].twitter;
                user.twitterAccessToken = req.user.admin.writerRequest[id].twitterAccessToken;
                user.twitterAccessTokenSecret = req.user.admin.writerRequest[id].twitterAccessTokenSecret;
            }
            //user.valid = true;
            user.save(function(err){
                if(err)
                    console.log(err);
            //else
            //console.log("saved");
            })
            //req.user.admin.writerRequest.splice(writerId,1);
            var find = _.findWhere(req.user.admin.writerRequest, {_id : writerId});
            // console.log(find);
            req.user.admin.writerRequest = _.without(req.user.admin.writerRequest, find);
            console.log(req.user.admin.writerRequest);
            req.user.save(function(err){
                if(err)
                    console.log(err);
                else
                    console.log("writer request spliced");
            })
            res.send();
            var changed_link = unsub_link + 'user_id=' + user._id;
            mandrill('/messages/send-template', {
                "template_name" : "Blurbi Writer Sign-up confirmation",
                "template_content" :  [
                ]  ,
                "message": {
                    to: [{
                        email: email
                    }],
                    from_email: 'derek@blurbi.ca',
                    subject: "Thanks for signing up on Blurbi!",
                    "merge": true,
                    "merge_vars": [
                    {
                        "rcpt": email,
                        "vars": [
                        {
                            "name": "user",
                            "content": name                                   
                        },
                        {
                            "name": "pass",
                            "content": pass,
                        },
                        {
                            "name": "UNSUB",
                            "content": changed_link
                        },
                        {
                            "name" : "change_password_link",
                            "content" : change_password_link
                        },
                        {
                            "name" : "login_link",
                            "content" : login_link
                        }
                        ]
                    }
                    ],
                },
            }, function(error, response)
            {
                //  console.log("djfksdf");
                //uh oh, there was an error
                if (error) console.log( JSON.stringify(error) );
            //everything's good, lets see what mandrill said
            // else console.log(response);
            });
        }
    })
}

exports.writeBlurbsPost =  function(req,res){
    var participate = null;
    var brandId = req.param('brandId');
    var expiredate = req.param('expiredate');
    var price = req.param('price');
    var ctaId = req.param('ctaId');
    var taglist=req.params.taglist;
    var listTag=taglist.split(',');
    var date = new Date();
    var message = req.body.message;
    var imagePath = '';
    var selected_thumbnail = null;
    var brandList = new Array();
    var msgId;

    if(brandId)
        participate = 'participated';

    if(req.body.selected_thumbnail)
        selected_thumbnail = req.body.selected_thumbnail;
   
    /*write image*/
    if(req.body.image_path){
        fs.readFile(req.body.image_path, function (err, data) {
            fs.writeFile('public/uploadImage/'+req.user._id+req.body.image_name,data, function (err) {
                if (err) throw err; 
            });
        });
        imagePath = 'uploadImage/'+req.user._id+req.body.image_name;
    }
    /*end save image in storage*/
    var des = req.body.message.replace( /\n/g, " " ).split( " " );
    var link;
    var j;
    var reg_url = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ; 

    for(j=0;j<des.length;j++){             
        if(reg_url.test(des[j]))
        {
            link = des[j];
            break;
        }
    }


    req.user.writer.historyWriteBlurb.push({
        'description': req.body.message,
        'path': req.user.logoPath, 
        'date' : date, 
        'status' : 'Pending', 
        'seen' : 'unseen',
        'participate': participate,
        'ctaId': ctaId,
        'brand': null

    });

    req.user.save(function(err){
        if(err)
            console.log(err);
                     
    });

    var len = req.user.writer.historyWriteBlurb.length - 1;
    msgId = req.user.writer.historyWriteBlurb[len]._id;

    User.find({ 'brand.profileInfo.company': { $ne: null } }).where('_id').in(listTag).exec(function(err,brands){
        if(!err && brands)
        {
            for(var i=0;i<brands.length;i++)
            {
                var price;
                if(brandId){
                    var find = _.filter(brands[i].brand.historyCallAction,function(item){ return item._id == ctaId });
                    if(find.length > 0){
                        find[0].status='Accepted';
                        find[0].writers.push(req.user._id);
                        price = find[0].price;

                    }
                    
                }
                else{
                    price = brands[i].brand.pricePerBlurb;
                }
                req.user.writer.historyWriteBlurb[len].brandList.push({'company': brands[i].brand.profileInfo.company, 'brandId': brands[i]._id});
                brands[i].brand.historyWriteBlurb.push({
                    'writerIndex': msgId,
                    'id':req.user._id, 
                    'writer': {
                        'name' : req.user.writer.profileInfo.name
                        },
                    'description': req.body.message, 
                    'path': req.user.logoPath, 
                    'date' : date, 
                    'price' : price, 
                    'status' : 'Pending', 
                    'seen' : 'unseen', 
                    'imagePath': imagePath,
                    'selected_thumbnail': selected_thumbnail,
                    'imagePath' : imagePath,
                    'ctaId' : ctaId
                });
               
                brands[i].save(function(err){
                    if(err)
                        console.log(err);
                })
            }
           
            req.user.save(function(err){
                if(err)
                    console.log(err);
            })
        }
       
    });


    if(link){
        link = link.trim(); 
        new embedly({
            key: '16f7a571ba3546f5ba52d638c76b9158'
        }, function(err, api) { api.oembed({ url: link }, function(err, objs) {
            console.log('response from embedly');
            console.log(objs);
            if(objs[0].description==null){
                var previewDescription = '';
            }
            else{
                var previewDescription = objs[0].description.substring(0,135)+'...';
            }
            /*start bitly shortend*/
            bitly.shorten(link, function(error,response){
                if (error)
                    console.log(error);
                var url;
                if(response.data.url){
                    url = response.data.url;
                }
                else{
                    url = link;
                }      
                var description_message = message.replace(reg_url,url);
                User.find({ 'brand.profileInfo.company': { $ne: null } }).where('_id').in(listTag).exec(function(err,brands){
                    if(!err && brands)
                    {
                        for(var i=0;i<brands.length;i++){

                            var len2 = brands[i].brand.historyWriteBlurb.length-1;
                            brands[i].brand.historyWriteBlurb[len2].linkInfo = objs[0];
                            brands[i].brand.historyWriteBlurb[len2].previewDes = previewDescription;
                            brands[i].brand.historyWriteBlurb[len2].previewUrl = url;
                            brands[i].brand.historyWriteBlurb[len2].description = description_message;

                            brands[i].save(function(err){
                                if(err)
                                    console.log(err);
                            })
                            if(i==brands.length - 1){
                                res.send();
                            }


                        }
                        
                    }
                })
           
            })
            /*end bitly shortend function*/
            if (!!err) {
                console.error(err.stack, objs);
                return;
            }
           
            });
        });
    }    /*end if link section*/
    else{
        res.send();

    }
   
   
}  /*end writeblurbipost*/

exports.brandContentPost = function(req,res){
    // console.log(req.body);
    console.log('roman');
    console.log(req.body);
    var id = req.body.id;
    console.log(req.url);
    if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id' : brandIndex
        }).exec(function(err,user){
            if(req.body.message)
            {
                user.brand.historyWriteBlurb[req.body.id].description=req.body.message;
                user.brand.historyWriteBlurb[req.body.id].facebook=req.body.fbState;
                user.brand.historyWriteBlurb[req.body.id].twitter=req.body.twtState;
                user.brand.historyWriteBlurb[req.body.id].linkedin=req.body.linkedinState;
                
                user.save(function(err){
                    if(err)
                        console.log(err);
                });
           
                res.redirect('/users/brandContent');
            }
            else
            {
                var writerId=user.brand.historyWriteBlurb[id].id;
                var writerIndex=user.brand.historyWriteBlurb[id].writerIndex;
                //user.brand.historyWriteBlurb.splice(req.body.id,1);
                user.brand.historyWriteBlurb[req.body.id].deleteStatus='Deleted';
                user.save(function(err){
                    if(err)
                        console.log(err);
                });
                if(writerId!=null)
                {
                    User.findOne({
                        _id: writerId
                    }).exec(function(err,writer){
                        if(!err && writer)
                        {
                    
                            var writerBlurb;
                            var find1 = _.filter(writer.writer.historyWriteBlurb, function(item){
                                return item._id == writerIndex;
                            })
                            if(find1.length > 0){
                                writerBlurb = find1[0];
                            }
                            else{
                                writerBlurb = writer.writer.historyWriteBlurb[writerIndex];
                            }
                            if(writerBlurb.status=='Pending')
                                writerBlurb.status='Deleted';
                            writer.save(function(err){
                                if(err)
                                    console.log(err);
                            });
                        }
                    })
                }
           
                res.redirect('/users/brandContent');
            }
        })
    }
    else{
        if(req.body.message)
        {   console.log(req.body.fbState);
            req.user.brand.historyWriteBlurb[req.body.id].description=req.body.message;
            req.user.brand.historyWriteBlurb[req.body.id].facebook=req.body.fbState;
            req.user.brand.historyWriteBlurb[req.body.id].twitter=req.body.twtState;
            req.user.brand.historyWriteBlurb[req.body.id].linkedin=req.body.linkedinState;
           
            req.user.save(function(err){
                if(err)
                    console.log(err);
            });
           
            res.redirect('/users/brandContent');
        }
        else
        {
            var writerId=req.user.brand.historyWriteBlurb[id].id;
            var writerIndex=req.user.brand.historyWriteBlurb[id].writerIndex;
            // req.user.brand.historyWriteBlurb.splice(req.body.id,1);
            req.user.brand.historyWriteBlurb[req.body.id].deleteStatus='Deleted';
            req.user.save(function(err){
                if(err)
                    console.log(err);
            });
            if(writerId!=null)
            {
                User.findOne({
                    _id: writerId
                }).exec(function(err,writer){
                    if(!err && writer)
                    {
                        var writerBlurb;
                        var find1 = _.filter(writer.writer.historyWriteBlurb, function(item){
                            return item._id == writerIndex;
                        })
                        if(find1.length > 0){
                            writerBlurb = find1[0];
                        }
                        else{
                            writerBlurb = writer.writer.historyWriteBlurb[writerIndex];
                        }
                        if(writerBlurb.status=='Pending')
                            writerBlurb.status='Deleted';
                        writer.save(function(err){
                            if(err)
                                console.log(err);
                        });
                    }
                })
            }
           
            res.redirect('/users/brandContent');
        }
    }
}
exports.participate = function(req,res){
    console.log(req.body);
}
exports.ret = function(req,res){
    var token=req.param('token');
    var payer_id=req.param('PayerID');
    var requestId=req.param('id');
    if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id': brandIndex
        }, function (err, user) {
            if(err) console.log(err);
            else if(user)
            {
                var pay_id;
                for(var i=0;i<user.paypal.length;i++)
                {
                    if(user.paypal[i].id==requestId)
                    {
                        pay_id=user.paypal[i].payment;
                        break;
                    }
                }
                console.log(pay_id);
                var execute_payment_details = {
                    "payer_id": payer_id
                };
                paypal_sdk.payment.execute(pay_id, execute_payment_details, function(error, payment){
                    if(error){
                        console.error(error);
                    }
                    else {
                        console.log(payment);
                        console.log(payment.transactions[0].amount);
                        console.log(payment.transactions[0].amount.total);
                        var amount=payment.transactions[0].amount.total*10;
                        var amount=amount/10;
                        discountForEachTopUp(user.brand.profileInfo.promoCode, amount);
                        if(req.session.selectedCampaignID){
                            var selectedCampaignID = req.session.selectedCampaignID;
                            req.session.selectedCampaignID = null;
                            var find=_.filter(user.brand.historyCallAction,function(item){return item._id==selectedCampaignID});
                            if(find.length>0){
                                find[0].perCampaignAmount+=amount;
                            }
                            user.brand.campaignBalance+=amount; 
                        }
                        else{
                            user.brand.accountBalance+=amount;
                        }
                        user.save(function(err)
                        {
                            if(err) console.log(err);
                        });
                        if(process.env.NODE_ENV){
                            res.redirect(303, 'https://localhost/users/TopUpAccount');
                        }
                        else
                        {
                            res.redirect(server_url + "users/TopUpAccount");
                        }
                    }
                });
            }  
        });
    }
    else{
        User.findOne({
            '_id': req.user._id
            }, function (err, user) {
            if(err) console.log(err);
            else if(user)
            {
                var pay_id;
                for(var i=0;i<user.paypal.length;i++)
                {
                    if(user.paypal[i].id==requestId)
                    {
                        pay_id=user.paypal[i].payment;
                        break;
                    }
                }
                console.log(pay_id);
                var execute_payment_details = {
                    "payer_id": payer_id
                };
                paypal_sdk.payment.execute(pay_id, execute_payment_details, function(error, payment){
                    if(error){
                        console.error(error);
                    }
                    else {
                        console.log(payment);
                        console.log(payment.transactions[0].amount);
                        console.log(payment.transactions[0].amount.total);
                        var amount=payment.transactions[0].amount.total*10;
                        var amount=amount/10;
                        discountForEachTopUp(user.brand.profileInfo.promoCode, amount);
                        if(req.session.selectedCampaignID){
                            var selectedCampaignID = req.session.selectedCampaignID;
                            req.session.selectedCampaignID = null;
                            var find=_.filter(req.user.brand.historyCallAction,function(item){return item._id==selectedCampaignID});
                            if(find.length>0){
                                find[0].perCampaignAmount+=amount;
                            }
                            req.user.brand.campaignBalance+=amount; 
                        }
                        else{
                            req.user.brand.accountBalance+=amount;
                        }
                        req.user.save(function(err)
                        {
                            if(err) console.log(err);
                        });
                        if(process.env.NODE_ENV){
                            res.redirect('https://localhost/users/TopUpAccount');
                        }
                        else
                        {
                            res.redirect(server_url + "users/TopUpAccount");
                        }
                    }
                });
            }  
        });
    }
}
exports.payment = function(req,res){    
    res.render('payment-form',{
        title: 'Stripe payment'
    });
};
exports.acc=function(req,res){
    res.send(req.user);
}
exports.paypalPayment=function(req,res){
    console.log("body"+req.user.userType);
    var amount=req.body.amount;
    var selectedCampaignID = req.body.campaignId;
    console.log("selected amount is : "+amount + "id : "+selectedCampaignID);
    var brandIndex = req.session.brandIndex;
    if(selectedCampaignID){
        req.session.selectedCampaignID = selectedCampaignID;
    }
    var return_url;
    var cancel_url;
    if(process.env.NODE_ENV)
    {
        return_url = "https://localhost/ret?id="+req.id,
        cancel_url = "https://localhost/ret?id="+req.id
    }
    else
    {
        return_url = server_url + "ret?id="+req.id,
        cancel_url = server_url + "ret?id="+req.id
    }
    var payment_details = {
        "intent":"sale",
        "redirect_urls":{
            "return_url": return_url,
            "cancel_url": cancel_url
        },
        "payer":{
            "payment_method":"paypal"
        },
        "transactions":[
        {
            "amount":{
                "total":amount  ,
                "currency":"CAD"
            },
            "description":"This is the payment transaction description."
        }
        ]
    };
    paypal_sdk.payment.create(payment_details, function(error, payment){
        if(error){
            console.error(error);
        } else {
            if(req.user.userType=='agency'){
                var brandIndex = req.session.brandIndex;
                User.findOne({
                    '_id': brandIndex
                }, function (err, user) {
                    if(err) console.log(err);
                    else
                    {
                        user.paypal.push({
                            'id': req.id, 
                            'payment': payment.id
                            });   
                        console.log("before saving to db"+user.paypal);     
                        user.save(function (err)
                        {        
                            if (err) // TODO handle the error
                                console.log("error in insertion "+err);
                        });
                    }  
                });
                res.redirect(payment.links[1].href);
            }
            else{
                User.findOne({
                    '_id': req.user._id
                    }, function (err, user) {
                    if(err) console.log(err);
                    else
                    {
                        user.paypal.push({
                            'id': req.id, 
                            'payment': payment.id
                            });   
                        console.log("before saving to db"+user.paypal);     
                        user.save(function (err)
                        {        
                            if (err) // TODO handle the error
                                console.log("error in insertion "+err);
                        });
                    }  
                });
                res.redirect(payment.links[1].href);
            }
        }
    });
}
exports.recieve = function(req,res){
    console.log('seema');
    console.log(req.body);
    var token=req.body.stripeToken;
    var amount=req.body.amount;
    var selectedCampaignID = req.body.campaignId;
    console.log(token);
    console.log(amount);
    stripe.charges.create(
    {
        amount: amount,
        currency: "cad",
        card: token
    },
    function(error, response) {
        if(error)
        {
            var err = "Error in charges creation";
            console.log(error);
            if(process.env.NODE_ENV)
                res.redirect("https://localhost/users/topupaccount?errmsg="+error);
            else
                res.redirect(server_url + "users/topupaccount?errmsg="+error);
        }
        else
        {
            if(req.user.userType=='brand'){
                //console.log("djfkdfj jaskdfj");
                discountForEachTopUp(req.user.brand.profileInfo.promoCode, amount/100);
                if(selectedCampaignID){
                    var find=_.filter(req.user.brand.historyCallAction,function(item){return item._id==selectedCampaignID});
                    if(find.length>0){
                        find[0].perCampaignAmount+=(amount/100);
                    }
                    req.user.brand.campaignBalance+=(amount/100); 
                }
                else{
                    req.user.brand.accountBalance+=(amount/100);
                }
                req.user.save(function(err)
                {
                    if(err) console.log(err);
                    else
                    {
                        if(process.env.NODE_ENV) 
                            res.redirect("https://localhost/users/topupaccount");
                        else
                            res.redirect(server_url + "users/topupaccount");
                    }
                });
            }
            else{
                var brandIndex = req.session.brandIndex;
                console.log(brandIndex);
                User.findOne({
                    '_id' : brandIndex
                }).exec(function(err,user){
                    if(!err && user){
                        discountForEachTopUp(user.brand.profileInfo.promoCode, amount/100);
                        if(selectedCampaignID){
                            var find=_.filter(user.brand.historyCallAction,function(item){return item._id==selectedCampaignID});
                            if(find.length>0){
                                find[0].perCampaignAmount+=(amount/100);
                            }
                            user.brand.campaignBalance+=(amount/100); 
                        }
                        else{
                            user.brand.accountBalance+=(amount/100);
                        }
                        user.save(function(err)
                        {
                            if(err) console.log(err);
                            else
                            {
                                if(process.env.NODE_ENV) 
                                    res.redirect("https://localhost/users/topupaccount");
                                else
                                    res.redirect(server_url + "users/topupaccount");
                            }
                        });
                    }

                })
            }
        }
    }
    );
}

exports.messageSeen = function(req,res){
    //console.log(req.body);
    var length = req.body.length;
    if(req.user.userType=='writer'){
        for(var i=length-1;i>=0;i--){
            // console.log(req.user.writer.historyCallAction[i].seen);
            if((req.user.writer.historyCallAction[i].seen=='seen') && (req.user.writer.historyCallAction[i].editStatus == 'No') )
            {
                //console.log("jfkdjf");
                /*break;*/
            }
            else
            {   
                console.log('done hat');
                req.user.writer.historyCallAction[i].seen='seen';
                req.user.writer.historyCallAction[i].editStatus = 'No';
                req.user.save(function(err){
                    if(err)
                        console.log(err);
                })
            }
        }
        //for(var i=length;i>=0; i--)
        // console.log(req.user.writer.historyCallAction[i]);
        res.send();
    }
    else if(req.user.userType=='brand'){
        for(var i=length-1;i>=0;i--){
            if(req.user.brand.historyWriteBlurb[i].seen=='seen')
                break;
            else
                req.user.brand.historyWriteBlurb[i].seen = 'seen';
        }
        req.user.save(function(err){
            if(err)
                console.log(err);
            else res.send();
        })
    }
    else if (req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id' : brandIndex
        }).exec(function(err,user){
            for(var i=length-1;i>=0;i--){
                if(user.brand.historyWriteBlurb[i].seen=='seen')
                    break;
                else
                    user.brand.historyWriteBlurb[i].seen = 'seen';
            }
            user.save(function(err){
                if(err)
                    console.log(err);
                else res.send();
            })
        })
    }
}
exports.checkPassword=function(req,res){
    // console.log(req.body);
    var pass = req.body.pass;
    if(req.user.isValidPassword(pass))
    {
        console.log("valid pass");
        res.send("valid");
    }
    else
    {
        console.log("invalid pass");
        res.send("invalid");
    }
}
exports.changePassword=function(req,res){
    //console.log(req.body);
    var pass = req.body.pass;
    //req.user.oldpassword = req.user.password;
    req.user.setPassword(pass);
    req.user.save(function(err){
        if(err)
            console.log(err);
        else{
            console.log("saved");
            res.send();
        }
    })
}
exports.changePricingPost = function(req,res)
{
    /*console.log("change pricing : "+ req.body.pricePerResponse);*/
    /*console.log(req.body.price);*/
    var price = req.body.price;
    var pricePerResponse = req.body.pricePerResponse;
    var CEid = req.body.CEid;
    var updateBlurbPrice = req.body.updateBlurbPrice;
    var updateResPrice = req.body.updateResPrice;
    console.log("post id : "+CEid + "updateBlurbPrice " + updateBlurbPrice);
    /*console.log("per blurbs : " + price + "per response : " + pricePerResponse);*/
    if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id' : brandIndex
        }).exec(function(err,brand){
            brand.brand.pricePerBlurb = price;
            /*update campaign or event price*/
            var length=brand.brand.historyCallAction.length;
            for(var i=0;i<length;i++)
            {
                if(brand.brand.historyCallAction[i]._id == CEid)
                {
                    console.log('got it');
                    brand.brand.historyCallAction[i].price=updateBlurbPrice;
                    brand.brand.historyCallAction[i].perResponse = updateResPrice;
                    brand.save(function(err){
                        if(err)
                            console.log('Error');
                        else
                            console.log('Done');
                    })
                }
            }
           /* end update campaign or event price*/
            brand.save(function(err){
                if(err)
                    console.log(err);
            })
        })
        res.send();
    }
    else{
            console.log('Else ');
            console.log(CEid);
            /*update campaign or event price*/
            var length=req.user.brand.historyCallAction.length;
            for(var i=0;i<length;i++)
            {
                if(req.user.brand.historyCallAction[i]._id == CEid)
                {
                    console.log('got it');
                    req.user.brand.historyCallAction[i].price=updateBlurbPrice;
                    req.user.brand.historyCallAction[i].perResponse = updateResPrice;
                    req.user.save(function(err){
                        if(err)
                            console.log('Error');
                        else
                            console.log('Done');
                    })
                }
            }
           /* end update campaign or event price*/
        if(price != undefined)
            req.user.brand.pricePerBlurb = price;
        if(pricePerResponse != undefined)
            req.user.brand.pricePerResponse = pricePerResponse;
        req.user.save(function(err)
        {
            if(err)
                console.log(err);
            else
                console.log(req.user.brand.pricePerBlurb);
        })
        res.send();
    }
}
exports.forgotPassword=function(req,res){
    User.findOne({
        'email':req.body.email
        }).exec(function(err,user){
        if(user)
        {
            //console.log(user.password);
            var pass=generatePassword();
            console.log(pass);
            user.setPassword(pass);
            user.save(function(err){
                if(err)
                    console.log(err);
            })
            var changed_link = unsub_link + 'user_id=' + user._id;
            mandrill('/messages/send-template', {
                "template_name" : "forgot password",
                "template_content" :  [
                ]  ,
                "message": {
                    to: [{
                        email: req.body.email
                        }],
                    from_email: 'derek@blurbi.ca',
                    subject: "Forgot Password!!",
                    "merge": true,
                    "merge_vars": [
                    {
                        "rcpt": req.body.email,
                        "vars": [
                        {
                            "name": "user",
                            "content": user.name                                   
                        },
                        {
                            "name": "pass",
                            "content": pass,
                        },
                        {
                            "name": "UNSUB",
                            "content": changed_link
                        }
                        ]
                    }
                    ],
                },
            }, function(error, response)
            {
                //uh oh, there was an error
                if (error) console.log( JSON.stringify(error) );
                //everything's good, lets see what mandrill said
                else console.log(response);
            });
            res.send();
        }
    })
}
exports.facebookSignup = function(req,res){
    req.session.radio=req.param('radio');
    console.log(req.session.radio);
    res.redirect('/auth/facebook');
}


exports.editImproveProfile = function(req,res){

    console.log(req.body);

    /*var find=_.filter(req.user.brand.improveProfile,function(item){return item._id==req.body.indexId});

        console.log(find);


        if(find.length>0){
           
            console.log(req.user.brand.improveProfile[0].fbPage[0]);
           
            req.user.brand.improveProfile[0].fbPage[0] = 'hoy na keno';
           

            
        }

        req.user.save(function(err){
            if(err){
                console.log(err);
            }else{
                console.log('done');
            }
        });*/

}


exports.editProfile = function(req,res){

    if(req.user.userType=='agency'){
        if(req.body.country_){
            req.user.agency.profileInfo.country = req.body.country_;
            req.user.save(function(err){
                if(err)
                    console.log(err);
                else
                {
                    res.redirect('/users/profile');
                }
            })
        }
    }
}
exports.editAgencyBrandProfile = function(req,res){
        /*console.log(req.body);*/
        var brandIndex = req.session.brandIndex;
        var acceptance = 0;
            User.findOne({
                '_id' : brandIndex
            }).exec(function(err,user){
            var editProfile = user.brand.profileInfo;
            for(var prop1 in req.body){
                for(var prop2 in editProfile){
                    if(prop1==prop2){
                        editProfile[prop2] = req.body[prop1];
                    }
                }
            }
            user.save(function(err){
                if(err)
                    console.log(err);
            })
            autoMatch(req.user._id, req.body.interest);
            for(var i=0;i<user.brand.historyWriteBlurb.length;i++)
            {
                if(user.brand.historyWriteBlurb[i].status=='Accepted')
                    acceptance++;
            }
            if(user.brand.historyWriteBlurb.length>0)
                acceptance = Math.floor((acceptance/user.brand.historyWriteBlurb.length)*100);
             
            res.redirect('/users/agencyBrandProfile');
        })
}
exports.changeSettings = function(req,res){
    if(req.user.userType=='brand')
        req.user.brand.emailSettings = req.body.emailSettings;
    else if(req.user.userType=='writer')
        req.user.writer.emailSettings = req.body.emailSettings;
    else
        req.user.agency.emailSettings = req.body.emailSettings;
    req.user.save(function(err){
        if(err)
            console.log(err);
        else
            console.log("email settings saved");
    })
    res.redirect('/users/settings');
}
exports.agencyBrandLinkTo = function(req,res){
    var brandIndex = req.session.brandIndex;
    User.findOne({
        '_id' : brandIndex
    }).exec(function(err,brand){
        res.render('users/agencyBrandLinkTo',{
            name: req.user.name,
            userType: req.user.userType,
            clients: brand.brand.clients,
            brandIndex: brandIndex,
            brands: req.user.agency.brands,
            historyWriteBlurb: brand.brand.historyWriteBlurb,
            historyCallAction: brand.brand.historyCallAction,
            brandLogoPath: brand.logoPath,
            logoPath: req.user.logoPath,
            accountBalance: brand.brand.accountBalance,
            campaignBalance: brand.brand.campaignBalance,
            RequestRecieve: brand.brand.RequestRecieve,
            profile: brand.brand.profileInfo,
            facebook: brand.facebook,
            twitter: brand.twitter,
            linkedin: brand.linkedin,
            bufferapp: brand.bufferapp
        })
    })
}
exports.twitterSignup = function(req,res){
    console.log(req.body);
    var email = req.body.email;
    req.session.radio = req.body.radio;
    req.session.email = req.body.email;
    User.findOne({
        'email' : email
    }).exec(function(err,user){
        if(user)
            res.redirect('/#signup_error');
        else{
            var writer= new User({
                'email' : email
            });
            writer.save(function(err){
                if(err)
                    console.log(err);
            })
        }
    })
    res.redirect('/auth/twitter');
}
exports.seeProfile = function(req,res){
    var id = req.param('id');
    var facebook = null;
    var twitter = null;
    var linkedin = null;
    var acceptance = 0;
    console.log('jdkfjlsdjf seema');
    if(req.user.userType=='writer'){
        User.findOne({
            '_id' : id
        }).exec(function(err,user){
           
            for(var i=0;i<user.brand.historyWriteBlurb.length;i++)
            {
                if(user.brand.historyWriteBlurb[i].status=='Accepted')
                {
                    acceptance++;
                // console.log(req.user.brand.historyCallAction[i].status);
                }
            }
            if(user.brand.historyWriteBlurb.length>0)
                acceptance = Math.floor((acceptance/user.brand.historyWriteBlurb.length)*100);
         
            if(user.facebook!=null){
                if(user.facebookPostPageType=='profile'){
                    facebook = user.facebook.link;
                }
                else if(user.facebookPostPageType=='page'){
                    facebook = "https://www.facebook.com/pages/" + user.facebookPageInfo.name + "/" + user.facebookPageInfo.id;
                }
                else{
                    facebook = "https://www.facebook.com/groups/" + user.facebookGroupInfo.id;
                }
               
            }
            if(user.twitter!=null)
                twitter = user.twitter.screen_name;
            if(user.linkedin!=null){
                if(user.linkedinPostPageType=='profile'){
                    linkedin = user.linkedin.publicProfileUrl;
                }
                else if(user.linkedinPostPageType=='group'){
                    linkedin = 'http://www.linkedin.com/groups/'+ user.linkedinGroupInfo.group.name + '-' + user.linkedinGroupInfo.group.id;
                }
                else{
                    linkedin = 'http://www.linkedin.com/company/' + user.linkedinCompanyInfo.id;
                }
               
            }
            /* console.log('thanks'+ user.brand.improveProfile);*/
            console.log(user.password);
            var facebook_followers_count = 0;
            var twitter_followers_count = 0;
            var linkedin_followers_count = 0;

            usersBot.findOne({'blurbiId' : user._id}).exec(function(err,botUser){
                if(!err && botUser){
                    console.log('user found in botUser');
                    var len_fb = botUser.brand.facebookSubscribersCount.length;
                    var len_twt = botUser.brand.twitterFollowersCount.length;
                    var len_link = botUser.brand.linkedinFollowersCount.length;

                    if(len_fb > 0){
                        len_fb --;
                        facebook_followers_count = botUser.brand.facebookSubscribersCount[len_fb].count;

                    }
                    if(len_twt > 0){
                        len_twt --;
                        twitter_followers_count = botUser.brand.twitterFollowersCount[len_twt].count;

                    }
                    if(len_link > 0){
                        len_link --;
                        linkedin_followers_count = botUser.brand.linkedinFollowersCount[len_link].count;

                    }
                }
                console.log(user.password);

                if(user.password !=undefined){
                    res.render('users/testProfile',{
                        id: req.user._id,
                        name: req.user.name,
                        userType: req.user.userType,
                        historyWriteBlurb: req.user.writer.historyWriteBlurb,
                        brandHistoryWriteBlurb: user.brand.historyWriteBlurb,
                        historyCallAction: req.user.writer.historyCallAction,
                        brandHistoryCallAction: user.brand.historyCallAction,
                        accountBalance: req.user.writer.accountBalance,
                        RequestRecieve: req.user.writer.RequestRecieve,
                        clients: req.user.writer.clients,
                        pricePerBlurb: req.user.writer.pricePerBlurb,
                        facebook: facebook,
                        twitter: twitter,
                        linkedin: linkedin,
                        profile : user.brand.profileInfo,
                        logoPath: req.user.logoPath,
                        brandLogoPath: user.logoPath,
                        acceptance: acceptance,
                        improveProfile: user.brand.improveProfile,
                        facebook_followers_count: facebook_followers_count,
                        twitter_followers_count: twitter_followers_count,
                        linkedin_followers_count: linkedin_followers_count

                    })

                }
                if(user.password == undefined){
                    console.log(user.brand.profileInfo);
                        res.render('users/agencyBrandProfile',{
                        id: req.user._id,
                        name: req.user.name,
                        userType: req.user.userType,
                        historyWriteBlurb: req.user.writer.historyWriteBlurb,
                        agencyHistoryWriteBlurb: user.brand.historyWriteBlurb,
                        historyCallAction: req.user.writer.historyCallAction,
                        agencyHistoryCallAction: user.brand.historyCallAction,
                        logoPath: req.user.logoPath,
                        accountBalance: req.user.writer.accountBalance,
                        RequestRecieve: req.user.writer.RequestRecieve,
                        clients: req.user.writer.clients,
                        pricePerBlurb: req.user.writer.pricePerBlurb,
                        facebook: facebook,
                        twitter: twitter,
                        linkedin: linkedin,
                        profile : user.brand.profileInfo,
                        brandLogoPath: user.logoPath,
                        acceptance: acceptance,
                        improveProfile: user.brand.improveProfile,
                        facebook_followers_count: facebook_followers_count,
                        twitter_followers_count: twitter_followers_count,
                        linkedin_followers_count: linkedin_followers_count
                    
                    })

                }
            })

           
        })
    }

    else if(req.user.userType=='admin'){
        User.findOne({
            '_id' : id
        }).exec(function(err,user){
            if(!acceptance){
                acceptance = 0;
                for(var i=0;i<user.brand.historyWriteBlurb.length;i++)
                {
                    if(user.brand.historyWriteBlurb[i].status=='Accepted')
                    {
                        acceptance++;
                    // console.log(req.user.brand.historyCallAction[i].status);
                    }
                }
                if(user.brand.historyWriteBlurb.length>0)
                    acceptance = Math.floor((acceptance/user.brand.historyWriteBlurb.length)*100);
            }
            if(user.facebook!=null){
                if(user.facebookPostPageType=='profile'){
                    facebook = user.facebook.link;
                }
                else if(user.facebookPostPageType=='page'){
                    facebook = "https://www.facebook.com/pages/" + user.facebookPageInfo.name + "/" + user.facebookPageInfo.id;
                }
                else{
                    facebook = "https://www.facebook.com/groups/" + user.facebookGroupInfo.id;
                }
               
            }
            if(user.twitter!=null)
                twitter = user.twitter.screen_name;
            if(user.linkedin!=null){
                if(user.linkedinPostPageType=='profile'){
                    linkedin = user.linkedin.publicProfileUrl;
                }
                else if(user.linkedinPostPageType=='group'){
                    linkedin = 'http://www.linkedin.com/groups/'+ user.linkedinGroupInfo.group.name + '-' + user.linkedinGroupInfo.group.id;
                }
                else{
                    linkedin = 'http://www.linkedin.com/company/' + user.linkedinCompanyInfo.id;
                }
               
            }
           /* console.log('thanks'+ user.brand.improveProfile);*/
            res.render('users/browseBrandProfile',{
                id: req.user._id,
                name: req.user.name,
                userType: req.user.userType,
                historyWriteBlurb: req.user.writer.historyWriteBlurb,
                historyCallAction: req.user.writer.historyCallAction,
                logoPath: req.user.logoPath,
                accountBalance: req.user.writer.accountBalance,
                RequestRecieve: req.user.writer.RequestRecieve,
                clients: req.user.writer.clients,
                pricePerBlurb: req.user.writer.pricePerBlurb,
                profile: req.user.writer.profileInfo,
                facebook: facebook,
                twitter: twitter,
                linkedin: linkedin,
                brandProfile : user.brand.profileInfo,
                brandLogoPath: user.logoPath,
                acceptance: acceptance,
                improveProfile: user.brand.improveProfile
            })
        })
    }


    else{
        User.findOne({
            '_id': id
        }).exec(function(err,user){
            console.log(user);
            if(!acceptance){
                acceptance = 0 ;
                for(var i=0;i<user.writer.historyWriteBlurb.length;i++)
                {
                    if(user.writer.historyWriteBlurb[i].status=='Accepted')
                        acceptance++;
                }
                if(user.writer.historyWriteBlurb.length>0)
                    acceptance = Math.floor((acceptance/user.writer.historyWriteBlurb.length)*100);
            }
            if(req.user.userType=='agency'){
                var brandIndex = req.session.brandIndex;
                User.findOne({
                    '_id' : brandIndex
                }).exec(function(err,brand){
                    res.render('users/writerProfile',{
                        name: req.user.name,
                        userType: req.user.userType,
                        clients: brand.brand.clients,
                        brandIndex: brandIndex,
                        brands: req.user.agency.brands,
                        historyWriteBlurb: user.writer.historyWriteBlurb,
                        historyCallAction: brand.brand.historyCallAction,
                        writerLogoPath: user.logoPath,
                        brandLogoPath: brand.logoPath,
                        logoPath: req.user.logoPath,
                        accountBalance: brand.brand.accountBalance,
                        RequestRecieve: brand.brand.RequestRecieve,
                        writerProfile: user.writer.profileInfo,
                        profile : brand.brand.profileInfo,
                        acceptance: acceptance,
                        joiningDate: user.joiningDate,
                        campaignBalance: brand.brand.campaignBalance
                    })
                })
            }
            else{
                res.render('users/writerProfile',{
                    name: req.user.name,
                    userType: req.user.userType,
                    clients: req.user.brand.clients,
                    historyWriteBlurb: user.writer.historyWriteBlurb,
                    historyCallAction: req.user.brand.historyCallAction,
                    writerLogoPath: user.logoPath,
                    logoPath: req.user.logoPath,
                    accountBalance: req.user.brand.accountBalance,
                    RequestRecieve: req.user.brand.RequestRecieve,
                    writerProfile: user.writer.profileInfo,
                    profile : req.user.profileInfo,
                    acceptance: acceptance,
                    joiningDate: user.joiningDate,
                    campaignBalance: req.user.brand.campaignBalance,
                })
            }
        })
    }
}
exports.writerDepositPost = function(req,res){
    res.send('ok');
}
exports.ebookDownload = function(req,res){
    console.log('ebookDownload');
    console.log(req.body);
    if(req.body.name)
        var info = "Name : " + req.body.name + "\n";
    if(req.body.email)
        info += "Email : " + req.body.email + "\n";
    if(req.body.phoneno)
        info += "Phone No : " + req.body.phoneno + "\n";
    if(req.body.select)
        info += "community : " + req.body.select + "\n";
    info += "------------------------------" + "\n";
    console.log(info);
    fs.open('public/signup/ebookDownload.txt','a',666,function(e,id){
        fs.write(id, info, null, 'utf8', function(){
            fs.close(id, function(){
                console.log('file closed');
            });
        });
    });
    res.send();
}
exports.registration = function(req,res){
   
    //console.log(req.body);
    if(req.body.email);
    var string = "email: " + req.body.email + "\n";
    if(req.body.community)
        var string = "community:" + req.body.community + "\n";
    fs.open('public/signup/registration.txt', 'a', 666, function( e, id ) {
        fs.write( id, string, null, 'utf8', function(){
            fs.close(id, function(){
                console.log('file closed');
            });
        });
    });
    mandrill('/messages/send-template', {
        "template_name" : "beta registration",
        "template_content" :  [
        ]  ,
        "message": {
            to: [{
                email: req.body.email
                }],
            from_email: 'derek@blurbi.ca',
            subject: "beta signup!!",
            "merge": true,
            "merge_vars": [
            {
                "rcpt": req.body.email,
                "vars": [
                {
                    "name": "UNSUB",
                    "content": unsub_link
                }
                ]
            }
            ],
        },
    }, function(error, response)
    {
        //uh oh, there was an error
        if (error) console.log( JSON.stringify(error) );
        //everything's good, lets see what mandrill said
        else console.log(response);
    });
    res.send();
}
/*function for custom marketing*/
exports.customMarketing = function(req,res){
    console.log('enter in custom marketing');
    console.log(req.body);
    mandrill('messages/send-template',{
        "template_name" : "customMarketing",
        "template_content" : [],
        "message" : {
            to: [{
                email : 'derek@blurbi.ca'
            }],
            from_email : 'helloblurbi@blurbi.ca',
            subject : 'custom marketing',
            "merge" : true,
            "merge_vars" : [{
                "rcpt" : 'derek@blurbi.ca',
                "vars" : [
                {
                    "name" : "name",
                    "content" : req.body.name
                },
                {
                    "name" : "phoneno",
                    "content" : req.body.number
                },
                {
                    "name" : "requirements",
                    "content" : req.body.requirement
                }
                ]
            }],
        },
    },function(error,response){
        if(error)
            console.log(JSON.stringify(error));
        else
            console.log(response);
    });
    res.send();
}
exports.unsubscribe = function(req,res){
  var user_id = req.param('user_id');
  console.log(user_id);
  User.findOne({'_id': user_id}).exec(function(err,user){
    if(!err && user){
        req.logout();
        user.isUnsubscribed = true;
        user.save(function(err){
            if(err)
                console.log(err);
        })
        res.render('unsubscribeSuccess');
    }
    else{
        res.render('error', { error: err });
    }
  })
}
exports.redirectLogin = function(req,res){
    if(req.user)
        res.redirect('/users/home');
    else
        res.redirect('/#login');
}
exports.signupModal = function(req,res){
    res.redirect('/#signup');
}
exports.redirectChangePassword = function(req,res){
    if(req.user)
    {
        if(req.user.valid)
            res.redirect('/users/settings#change_password');
        else
            res.redirect('/users/home');
    }
    else{
        req.session.change_password = 123;
        res.redirect('/#login');
    }
}
exports.addBrands = function(req,res){
    // console.log(req.user.email);
    res.render('users/addBrands',{
        name: req.user.name,
        userType: req.user.userType,
        logoPath: req.user.logoPath,
        brands: req.user.agency.brands,
        valid: req.user.valid,
        email: req.user.email
    })
}
exports.addBrandsPost = function(req,res){
    //console.log(req.body);
    var file;
    var user = new User({
        userType: 'brand'
    });
    user.brand.profileInfo = req.body;
    if(req.files){
        file = req.files;
        fs.readFile(req.files.image.path, function (err, data) {
            fs.writeFile('public/profile_pictures/'+ user._id + req.files.image.name,data  , function (err) {
                if (err) throw err; 
                fs.unlink(req.files.image.path, function (err){
                  if (err)
                     throw err;
                  else
                  {
                    console.log('file deleted');

                  }
                });
            });
        });

        user.logoPath='profile_pictures/' + user._id + file.image.name;
    }
    var date = new Date();
    user.brand.emailSettings = ['SiteActions','SiteNews','HelpfulStuff'] ;


    var today=new Date();
    today=today.toDateString();
    user.joiningDate= today;
    user.lastLogin = req.user.lastLogin;
    user.save(function(err){
        if(err)
            console.log(err);
        signupDefaultBlurbs(user._id, req.body.interest);
        autmatch(user._id, req.body.interest);
    })
    // console.log(user._id);
    req.user.agency.brands.push({
        'id' : user._id, 
        'company' : user.brand.profileInfo.company, 
        'logoPath' : user.logoPath
    });
    req.user.save(function(err){
        if(err)
            console.log(err);
    })
    res.redirect('/users/settings');
}
/*
this is for test */
exports.writerRegistration = function(req,res){
    res.render('writerRegistrationSuccess');
}
exports.writerContentPost = function(req,res){
    // console.log(req.body);
    var brandId = req.body.brandId;
    var ctaId = req.body.ctaId;
    User.findOne({
        '_id' : brandId
    }).exec(function(err,user){
        if(!err && user){
            var find = _.filter(user.brand.historyCallAction,function(item){ return item._id == ctaId});
            if(find.length > 0){
                find[0].writersDenied.push(req.user._id);
                user.save(function(err){
                    if(err)
                        console.log(err);
                })

            }
           
            res.send();

        }
      
       
    })
}
exports.terms = function(req,res){
    res.render('terms');
}
exports.policy = function(req,res){
    res.render('policy');
}
exports.FAQuser = function(req,res){
    if(req.user.userType=='brand')
    {
        res.render('users/BrandFAQ',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            historyCallAction: req.user.brand.historyCallAction,
            campaignBalance: req.user.brand.campaignBalance
        })
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id': brandIndex
        })
        .exec(function(err,brand){
            res.render('users/BrandFAQ',{
                name: req.user.name,
                userType: req.user.userType,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                logoPath: req.user.logoPath,
                brandLogoPath: brand.logoPath,
                accountBalance: brand.brand.accountBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                profile: brand.brand.profileInfo,
                clients: brand.brand.clients,
                historyCallAction: brand.brand.historyCallAction,
                campaignBalance: brand.brand.campaignBalance
            })
        })
    }
    else if(req.user.userType=='writer')
    {
        res.render('users/FAQuser',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            historyCallAction: req.user.writer.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.writer.accountBalance,
            RequestRecieve: req.user.writer.RequestRecieve,
            clients: req.user.writer.clients,
        })
    }
}
exports.Feedback = function(req,res){
    if(req.user.userType=='brand')
    {
        res.render('users/Feedback',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            historyCallAction: req.user.brand.historyCallAction,
            campaignBalance: req.user.brand.campaignBalance
        })
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id': brandIndex
        })
        .exec(function(err,brand){
            res.render('users/Feedback',{
                name: req.user.name,
                userType: req.user.userType,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                logoPath: req.user.logoPath,
                brandLogoPath: brand.logoPath,
                accountBalance: brand.brand.accountBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                profile: brand.brand.profileInfo,
                clients: brand.brand.clients,
                historyCallAction: brand.brand.historyCallAction,
                campaignBalance: brand.brand.campaignBalance
            })
        })
    }
    else if(req.user.userType=='writer')
    {
        res.render('users/Feedback',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            historyCallAction: req.user.writer.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.writer.accountBalance,
            RequestRecieve: req.user.writer.RequestRecieve,
            clients: req.user.writer.clients,
        })
    }
}
exports.feedbackPost = function(req,res){
    // console.log(req.body);
    mandrill('/messages/send', {
        "message": {
            to: [{
                email: 'helloblurbi@blurbi.ca'
            }],
            from_email: 'derek@blurbi.ca',
            subject: "Feedback!",
            html:'<p><b>Email: ' + req.body.email + '</b></p>'+
            '<p><b>Name: ' + req.body.name + '</b></p>'+
            '<p><b>Phone: ' + req.body.phone + '</b></p>'+
            '<p><b>Comment: ' + req.body.comment + '</b></p>'
        },
    }, function(error, response)
    {
        //console.log("djfksdf");
        //uh oh, there was an error
        if (error) console.log( JSON.stringify(error) );
        //everything's good, lets see what mandrill said
        else {
            console.log(response);
            //res.end();
            res.send('ok');
        }
    });
}
exports.logorender = function(req,res){
    var img = fs.readFileSync('betatoplogo125.png');
    res.writeHead(200, {
        'Content-Type': 'image/gif'
    });
    res.end(img, 'binary');
}
exports.preferredNetworks = function(req,res){
    //console.log(req.body);
    if(req.user.userType=='brand'){
        if(req.body.facebook=='true'){
            req.user.brand.facebookOn = true;
        }
        else{
            req.user.brand.facebookOn = false;
        }
        if(req.body.twitter=='true'){
            req.user.brand.twitterOn = true;
        }
        else{
            req.user.brand.twitterOn = false;
        }
        if(req.body.buffer=='true'){
            req.user.brand.bufferOn = true;
        }
        else{
            req.user.brand.bufferOn = false;
        }
        if(req.body.linkedin=='true'){
            req.user.brand.linkedinOn = true;
        }
        else{
            req.user.brand.linkedinOn = false;
        }
        req.user.save(function(err){
            if(err)
                console.log(err);
            else 
                res.send();
        })
    }
}
exports.testlogo = function(req,res){
    // console.log("uploaded image"); 
    // console.log(req.user.logoPath);
    var corX = req.body.corX,
        corY = req.body.corY,
        width = req.body.width,
        height = req.body.height;
    
    gm('public/'+req.user.logoPath)
      .crop(width, height, corX, corY)
      .write( "public/"+req.user.logoPath, function(err){
        if (err) return console.dir(arguments)
        console.log(this.outname + " created  ::  " + arguments[3])
      }
    )   
   
    res.send(req.files);
}



exports.agencyBrandTestLogo = function(req,res){

    console.log("uploaded image for agency brand"); 
    

    var corX = req.body.corX,
        corY = req.body.corY,
        width = req.body.width,
        height = req.body.height;


   
    var brandIndex = req.session.brandIndex;
    if(brandIndex){
        // console.log(brandIndex);
        for(var i=0; i<req.user.agency.brands.length; i++){

            if(brandIndex == req.user.agency.brands[i].id){
                console.log("profile : "+req.user.agency.brands[i].logoPath);

                gm('public/'+req.user.agency.brands[i].logoPath)
                  .crop(width, height, corX, corY)
                  .write( "public/"+req.user.agency.brands[i].logoPath, function(err){
                    if (err) return console.dir(arguments)
                    console.log(this.outname + " created  ::  " + arguments[3])
                  }
                ) 
            }
        }
    }


    res.send(req.files);
}





exports.deactivate = function(req,res){
    //console.log("seema das");
    if(req.user.userType=='agency'){
        var l=0;
        for(var i=0; i< req.user.agency.brands.length; i++){
            User.findOne({
                '_id' : req.user.agency.brands[i].id
                }).exec(function(err,user){
                    var RequestSend = new Array();
                    for(var j=0; j< user.brand.RequestSend.length; j++){
                                RequestSend.push(user.brand.RequestSend[j].id);
                    }
                    User.find({
                        'writer.profileInfo.name': {
                            $ne: null
                        }
                    }).where('_id'.toString()).in(RequestSend).exec(function(err,writers){
                        //console.log(writers);
                        if(!err && writers.length>0){
                            for(var k=writers.length-1; k>=0; k--){
                                (function(k,RequestSend){
                                    writers[k].writer.RequestRecieve = _.without(writers[k].writer.RequestRecieve,_.findWhere(writers[k].writer.RequestRecieve,{id: user._id.toString()}));
                                    writers[k].save(function(err){
                                        if(err){
                                            console.log(err);
                                        }
                                        else{
                                            l++;
                                            console.log(l);
                                            console.log(writers.length*req.user.agency.brands.length);
                                            if(l==writers.length*req.user.agency.brands.length){
                                                req.logout();
                                                res.redirect('/');
                                            }
                                        }
                                    })
                                })(k,RequestSend)
                                req.user.email = 'deactivate@blurbi.ca';
                                req.user.save(function(err){
                                    if(err)
                                        console.log(err);
                                })
                                user.email = 'deactivate@blurbi.ca';
                                user.save(function(err){
                                    if(err)
                                        console.log(err);
                                })
                                req.session.brandIndex = null;
                                req.session.radio = null;
                                req.session.writer_name = null;
                                req.session.writer_email = null;
                                req.session.email = null;    
                            }
                        }
                    })
            })
        }
    }
    else if(req.user.userType=='brand'){
        var l=0;
        var RequestSend = new Array();
        for(var i=0; i< req.user.brand.RequestSend.length; i++){
            RequestSend.push(req.user.brand.RequestSend[i].id);
        }
         //console.log(RequestSend);
         User.find({
            'writer.profileInfo.name': {
                $ne: null
            }
        }).where('_id'.toString()).in(RequestSend).exec(function(err,writers){
            if(!err && writers.length>0){
                 for(var j=writers.length-1; j>=0; j--){
                    (function(j){
                        writers[j].writer.RequestRecieve = _.without(writers[j].writer.RequestRecieve,_.findWhere(writers[j].writer.RequestRecieve,{id: req.user._id.toString()}));
                        writers[j].save(function(err){
                            if(err){
                                console.log(err);
                            }
                            else{
                                l++;
                                if(l==writers.length){
                                    req.logout();
                                    res.redirect('/');
                                }
                            }
                        })
                    })(j)
                    req.user.email = 'deactivate@blurbi.ca';
                    req.user.save(function(err){
                        if(err)
                            console.log(err);
                    })
                    req.session.brandIndex = null;
                    req.session.radio = null;
                    req.session.writer_name = null;
                    req.session.writer_email = null;
                    req.session.email = null;    
                }
            }
            else{
                    req.user.email = 'deactivate@blurbi.ca';
                    req.user.save(function(err){
                        if(err)
                            console.log(err);
                    })
                    req.session.destroy();
                    req.logout();
                    res.redirect('/'); 
            }
            //console.log(writers);
        })
    }
    else if(req.user.userType=='writer') {
        var l = 0;
        var RequestSend = new Array();
        for(var i=0; i< req.user.writer.RequestSend.length; i++){
            RequestSend.push(req.user.writer.RequestSend[i].id);
        }
        User.find({
            'brand.profileInfo.company': {
                $ne: null
            }
        }).where('_id'.toString()).in(RequestSend).exec(function(err,brands){
            //console.log(writers);
           if(!err && brands.length>0){
                 for(var j=brands.length-1; j>=0; j--){
                    (function(j){
                        brands[j].brand.RequestRecieve = _.without(brands[j].brand.RequestRecieve,_.findWhere(brands[j].brand.RequestRecieve,{id: req.user._id.toString()}));
                        brands[j].save(function(err){
                            if(err){
                                console.log(err);
                            }
                            else{
                                l++;
                                if(l==brands.length){
                                    req.logout();
                                    res.redirect('/');
                                }
                            }
                        })
                    })(j)
                    req.user.email = 'deactivate@blurbi.ca';
                    req.user.save(function(err){
                        if(err)
                            console.log(err);
                    })
                    req.session.brandIndex = null;
                    req.session.radio = null;
                    req.session.writer_name = null;
                    req.session.writer_email = null;
                    req.session.email = null;    
                }
           }
           else{
                 req.user.email = 'deactivate@blurbi.ca';
                    req.user.save(function(err){
                        if(err)
                            console.log(err);
                    })
                    req.session.destroy();
                    req.logout();
                    res.redirect('/');   
           }
        })
    }
}
exports.addWriters = function(req,res){
    var change_password_link;
    var login_link;
    if(process.env.NODE_ENV){
        change_password_link = "https://localhost/users/redirectChangePassword";
        login_link = "https://localhost/users/redirectLogin"
    }
    else{
        change_password_link = "https://blurbi.ca/users/redirectChangePassword";
        login_link = "https://blurbi.ca/users/redirectLogin"
    }
    // console.log(req.body);
    var email = req.body.email;
    User.findOne({'email' : email}).exec(function(err,user){
        if(user){
            console.log('not available');
            res.send('not available');
        }
        else{
            res.send(req.body.email);
            var user = new User(req.body);
            var pass = generatePassword();
            console.log(pass);
            user.setPassword(pass);
            user.userType = 'writer';
            user.writerType = 'internal';
            req.user.brand.clients.push(user._id);
            req.user.brand.internalClients.push(user._id);
            user.writer.clients.push(req.user._id);
            user.save(function(err){
                if(err)
                    console.log(err);
            })
            req.user.save(function(err){
                if(err)
                    console.log(err);
            })
            var changed_link = unsub_link + 'user_id=' + user._id;
            mandrill('/messages/send-template', {
                "template_name" : "Blurbi Internal Writer Add confirmation",
                "template_content" :  [
                ]  ,
                "message": {
                    to: [{
                        email: req.body.email
                        }],
                    from_email: 'derek@blurbi.ca',
                    subject: "Welcome to Blurbi!",
                    "merge": true,
                    "merge_vars": [
                    {
                        "rcpt": req.body.email,
                        "vars": [
                        {
                            "name": "name",
                            "content": req.user.brand.profileInfo.company                                    
                        },
                        {
                            "name" : "email",
                            content: req.body.email,
                        },
                        {
                            "name": "pass",
                            "content": pass
                        },
                        {
                            "name": "UNSUB",
                            "content": changed_link
                        },
                        {
                            "name" : "change_password_link",
                            "content" : change_password_link
                        },
                        {
                            "name" : "login_link",
                            "content" : login_link
                        }
                        ]
                    }
                    ],
                },
        }, function(error, response){
            //console.log("djfksdf");
            //uh oh, there was an error
            if (error) console.log( JSON.stringify(error) );
            //everything's good, lets see what mandrill said
            else console.log(response);
            //console.log("HERE");
        });
        }
    })
}


exports.invoiceAmountPost = function(req,res){
    // console.log(req.body);


     var find =_.filter(req.user.admin.historyInvoiceAction,function(item){return item._id==req.body.id});

     /*console.log(find)*/

     if(find.length>0){
        find[0].depositedAmount = req.body.updateDepositedAmount;

        req.user.save(function(err){
            if(err){
                console.log(err);
            }else{                
                res.send();
            }
         });
     }


    /*console.log(req.body.campaignId);*/
     User.find({brandType: 'enterprise'}).exec(function(err,user){
        if(user){

         

            for(var i=0; i<user.length;i++){
                for(var j=0; j<user[i].brand.historyCallAction.length; j++){
                    if(user[i].brand.historyCallAction[j]._id == req.body.campaignId){
                        
                        // console.log(user[i].brand.campaignBalance);
                        user[i].brand.historyCallAction[j].perCampaignAmount = parseInt(user[i].brand.historyCallAction[j].perCampaignAmount) + parseInt(req.body.addedCampaignAmount);
                        user[i].brand.campaignBalance = parseInt(user[i].brand.campaignBalance) + parseInt(req.body.addedCampaignAmount);
                        user[i].save(function(err){
                            if(err){
                                console.log(err);
                            }else{
                                console.log('done updating');
                            }
                        });
                    }
                }
            }

        
            User.findOne({userType: 'admin'}).exec(function(err,admins){
              
                if(admins){

                    var len =  admins.admin.historyInvoiceAction.length ;
                   
                    if(len == 0){
                      len = 1;
                    }
                    len = len+1;
                    for(var i=0; i<user.length; i++){
                        console.log(admins.admin.historyInvoiceAction.length);
                        user[i].admin.invoiceIndexNo = len;

                        user[i].save(function(err){
                            if(err){
                                console.log(err);
                            }else{
                                console.log('saved');
                            }
                        });
                    }
                    
                }else{
                    console.log(err);
                }
            });
           
            
        }else{
            console.log('not found');
        }
     })

     
    if(req.user.brandType == 'enterprise'){
        console.log('enter');

        User.findOne({userType: 'admin'}).exec(function(err,user){
            if(user){
                /*console.log(user)*/

                user.admin.historyInvoiceAction.push({
                    company: req.body.company.company,
                    userId: req.body.userId,
                    campaignId: req.body.selectedCampaignId,
                    campaignTitle: req.body.campaignTitle,
                    invoiceAmount: req.body.invoiceAmount,
                    invoiceIndexNo: req.body.invoiceIndexNo,
                    depositedAmount: req.body.campaignDepositedAmount

                });

                user.save(function(err){
                    if(err){
                        console.log(err)
                    }else{
                        res.send();
                    }
                });


            }else{
                console.log('not find');
            }
        })

        
    }


}



exports.enterprise = function(req,res){
    
    /*console.log(req.user.admin.historyInvoiceAction);*/
    if(req.user.userType == 'admin'){
        // console.log(req.user.admin.historyInvoiceAction.length);

        res.render('users/enterprise',{
            id: req.user._id,
            historyInvoiceAction: req.user.admin.historyInvoiceAction,
            userType: req.user.userType
        });
    }else{
        console.log('Invalid users');
    }
    
}



exports.transactions = function(req,res){
    if(req.user.userType == 'admin'){

        var weeklyBlurbsAccepted = 0;
        var monthlyBlurbsAccepted = 0;
        var weeklyRevenue = 0;
        var monthlyRevenue = 0;

        User.find({userType: 'brand'}).exec(function(err,brands){
            
            if(brands){
                console.log(brands.length);

                for(var i=0; i<brands.length; i++){
                    var count=0;
                    var price=0;
                    console.log(brands[i].brand.profileInfo.email);
                    console.log(brands[i].brand.historyWriteBlurb.length);
                    for(var j=0; j<brands[i].brand.historyWriteBlurb.length; j ++){
                        if(brands[i].brand.historyWriteBlurb[j].status == 'Accepted'){

                            count++;                           
                            price= price+brands[i].brand.historyWriteBlurb[j].price;
                           
                            var oneDay = 24*60*60*1000;
                            var  blurbPostedDate = new Date(brands[i].brand.historyWriteBlurb[j]._id.getTimestamp());
                            var today = new Date();
                            
                            console.log('postedDate : '+ blurbPostedDate+' today : '+today);
                            var dayCount = Math.round(Math.abs((blurbPostedDate.getTime() - today.getTime())/(oneDay)));
                            console.log('dayCount '+dayCount);

                            if(dayCount <= 7){
                                 weeklyBlurbsAccepted++;
                                 weeklyRevenue = weeklyRevenue + brands[i].brand.historyWriteBlurb[j].price;
                            }

                            if(dayCount <= 30){
                                 monthlyBlurbsAccepted++;
                                 monthlyRevenue = monthlyRevenue + brands[i].brand.historyWriteBlurb[j].price;
                            }



                        }
                        
                    }

                    console.log(count);
                    console.log(price);

                }

                console.log('blurbsAccepted: '+weeklyBlurbsAccepted+ ' Revenue : '+weeklyRevenue);
                console.log('blurbsAccepted: '+monthlyBlurbsAccepted+ ' Revenue : '+monthlyRevenue);

            }else{
                console.log(err);
            }

        });

        res.render('users/transactions',{
            userType: req.user.userType
        });
    }else{
        console.log('Invalid users');
        res.redirect('/');

    }
}

exports.sitestats = function(req,res){
    if(req.user.userType == 'admin'){
        res.render('users/sitestats',{
            userType: req.user.userType
        });
    }
}


exports.showPostedBlurbs = function(req,res){
    // console.log(req.body);


    User.findOne({userType: 'admin'}).exec(function(err,user){
            if(user){
                /*console.log(user)*/

                user.admin.historyWriteBlurb.push({
                    companyName: req.body.companyName,
                    description: req.body.des,
                    writerName: req.body.writerName,
                    price: req.body.price,
                    si: req.body.si,
                    status: 'Accepted'

                });

                user.save(function(err){
                    if(err){
                        console.log(err)
                    }else{
                        console.log('done');
                    }
                });


            }else{
                console.log('not find');
            }
        })



}


exports.brandContentShow = function(req,res){
   if(req.user.userType == 'admin'){

   
    // console.log(req.user.admin.historyWriteBlurb);
    res.render('users/adminBrandContentShow',{
        historyWriteBlurb: req.user.admin.historyWriteBlurb,
        userType: req.user.userType
    });



   }else{
    console.log('invalid user');
   }
}


exports.adminBrowseBrands = function(req,res){
    if(req.user.userType == 'admin'){

        var allBrands = new Array();
        var acceptance;
        var email;
        var lastLogin;
        var agencyBrandId;

        
        var find = new Array();
        User.find({userType: 'brand'}).exec(function(err,brand){

            
            if(brand){                

                for(var i=0; i<brand.length; i++){

                    acceptance = 0;
                    for(var j=0;j<brand[i].brand.historyWriteBlurb.length;j++){
                        if(brand[i].brand.historyWriteBlurb[j].status=='Accepted')
                        {
                            acceptance++;
                        }
                    }


                    if(brand[i].brand.historyWriteBlurb.length>0)
                        acceptance = Math.floor((acceptance/brand[i].brand.historyWriteBlurb.length)*100);

                    email = brand[i].email;
                    lastLogin = brand[i].lastLogin;
                    agencyBrandId = brand[i]._id;
                    /*console.log(email);*/
                    if(email == undefined){
                        /*console.log('inside me');
                        console.log(brand[i].brand.profileInfo.email);*/
                        email = brand[i].brand.profileInfo.email;                        

                    }

                   
                    /*console.log('email: '+ email);*/
                    allBrands.push({
                        'profileInfo': brand[i].brand.profileInfo, 
                        'id' : brand[i]._id, 
                        'logoPath' : brand[i].logoPath, 
                        'acceptance' : acceptance, 
                        'pricePerBlurb' : brand[i].brand.pricePerBlurb,
                        'historyWriteBlurb': brand[i].brand.historyWriteBlurb,
                        'lastLogin' : lastLogin,
                        'email' : email,
                        'joiningDate' : brand[i].joiningDate
                    });

                }


                /*for(var i=0;i<allBrands.length; i++){
                    console.log(allBrands[i].profileInfo.email);
                    
                }*/


            }else{
                console.log(err);
            }

            console.log(allBrands.length);

            res.render('users/adminBrowseBrands',{
                allBrands: allBrands,
                userType: req.user.userType 
            });

        }); 


        
    }
}



exports.browseWriters = function(req,res){
   
    if(req.user.userType == 'admin'){

        var allBrands = new Array();
        var allWriters = new Array();
        var allWrittenBlurbs= new Array();

        User.find( { $or: [{userType: 'writer' },{userType: 'brand'}] }).exec(function(err,user){

            if(user){
                // console.log(user.length);
                for(var i=0; i<user.length; i++){
                  
                    if(user[i].userType == 'writer'){
                      
                        allWriters.push({
                            'profileInfo' : user[i].writer.profileInfo,
                            'clientsId' : user[i].writer.clients,
                            'lastLogin' : user[i].lastLogin,
                            'logoPath' : user[i].logoPath,
                            'email' : user[i].email,
                            'historyWriteBlurb': user[i].writer.historyWriteBlurb
                        });



                    }

                    if(user[i].userType == 'brand'){
                        allBrands.push({
                            'companyName': user[i].brand.profileInfo.company,
                            'brandId' : user[i]._id
                        });

                    }
                    
                }



            }else{
                console.log(err);
            }
            console.log(allWriters.length);
            /*console.log(allBrands);*/


            for(var i=0; i<allWriters.length; i++){
                console.log(allWriters[i].historyWriteBlurb.length);
            }




            res.render('users/adminBrowseWriters',{
                allWriters: allWriters,
                allBrands: allBrands,
                userType: req.user.userType 

            });
        });



        

        
    }else{
        console.log('Invalid user');
        res.redirect('/');
    }
}




exports.activeAccount = function(req,res){
   var id = req.param('id');
   var email = req.param('email');
   User.findOne({'_id' : id}).exec(function(err,user){
        if(!err && user){
            if(user.email==email){

                if(!user.valid){
                    user.valid = true;
                    user.save(function(err){
                        if(err)
                            console.log(err);
                        else{
                            console.log('validate');
                            res.redirect('/activatedAccount');

                        } 
                           
                    })

                }
                else{
                    res.redirect('/');

                }
              
               
               
            }

        }
        else{
            res.redirect('/');
        }
   })
}

exports.dummyForCallback = function(req,res){

    res.render('dummyForCallback');
}

exports.activatedAccount = function(req,res){
    if(req.user.valid){
        
        if(req.user.uncheckAlert)
            res.redirect('/users/home');
        else
            res.render('activatedAccount');
    }
    else{
        res.render('activatedAccount');

    }
}

exports.disconnectLink = function(req,res){

    //console.log(req.body);
    var channel = req.body.channel;

    if(req.session.brandIndex){
        var brandIndex = req.session.brandIndex;
        User.findOne({_id: brandIndex}).exec(function(err,user){
                if(!err && user){
                    if(channel=='facebook'){
                    user.facebook = null;

                }
                else if(channel=='twitter'){
                    user.twitter = null;

                }
                else if(channel=='linkedin'){
                    user.linkedin = null;

                }

                user.save(function(err){
                    if(err){
                        console.log(err);
                    }
                    else
                    {
                        res.send('ok');
                    }
                })

            }
        })

    }
    else{

        if(channel=='facebook'){
            req.user.facebook = null;

        }
        else if(channel=='twitter'){
            req.user.twitter = null;

        }
        else if(channel=='linkedin'){
            req.user.linkedin = null;

        }

        req.user.save(function(err){
            if(err){
                console.log(err);
            }
            else
            {
                res.send('ok');
            }
        })

    }

   

}

exports.changeEmail = function(req,res){

    var email = req.body.email;
    var emailChange_link;
    if(process.env.NODE_ENV){
        emailChange_link = "https://localhost/users/emailChangeConfirm/";
    }
    else{

        emailChange_link = "https://blurbi.ca/users/emailChangeConfirm/";
    }

   emailChange_link = emailChange_link +  '?new_email=' + req.body.email + '&old_email=' + req.user.email + '&id=' + req.user._id;

  
    var changed_link = unsub_link + 'user_id=' + req.user._id;
    mandrill('/messages/send-template', {
        "template_name" : "email change",
        "template_content" :  [
        ]  ,
        "message": {
            to: [{
                email: req.body.email
                }],
            from_email: 'derek@blurbi.ca',
            subject: "email change!!",
            "merge": true,
            "merge_vars": [
            {
                "rcpt": req.body.email,
                "vars": [
                    {
                        "name": "user",
                        "content": req.user.name                                   
                    },
                    {
                        "name": "UNSUB",
                        "content": changed_link
                    },
                    {
                        "name" : "email_change_link",
                        "content": emailChange_link
                    }
                ]
            }
            ],
        },
    }, function(error, response)
    {
        //uh oh, there was an error
        if (error) console.log( JSON.stringify(error) );
        //everything's good, lets see what mandrill said
        else{
            console.log(response);
            res.send('ok');
         } 
    });
   
        
 
}

exports.changeEmailConfirm = function(req,res){

    var new_email = req.param('new_email');
    var old_email = req.param('old_email');
    var id = req.param('id');

    User.findOne({email : new_email}).exec(function(err,user){
        if(!err && user){
            res.render('users/changeEmailConfirm',{
                err: 'something wrong'

            });

        }
        else{

            User.findOne({email: old_email}).exec(function(err,find_user){
                if(!err && find_user){

                    if(find_user._id==id){
                        find_user.email = new_email;
                        find_user.save(function(err){
                            if(err)
                                console.log(err);
                        })
                        res.render('users/changeEmailConfirm');

                    }
                    else{
                        res.render('users/changeEmailConfirm',{
                            err: 'something wrong'

                        });
                    }

                }
                else{
                    res.render('users/changeEmailConfirm',{
                        err: 'something wrong'

                    });

                }
            })
            

        }
    })

}



exports.modal = function(req,res){
    res.render('users/modal');
}
exports.testAnalytics = function(req,res){

    var twitterFollowersCount = new Array();
    var linkedinFollowersCount = new Array();
    var facebookSubscribersCount = new Array();
    var lastMonthTopBlurbers = new Array();

    if(req.user.userType=='brand')
    {

        usersBot.find({userType: 'writer'}).exec(function(err,writers){
            if(!err && writers){
                  
                    lastMonthTopBlurbers = writers;
                    usersBot.findOne({blurbiId: req.user._id}).exec(function(err,botUser){
                    if(!err && botUser){

                        for(var i=0;i<req.user.brand.blurbsLastWeek.length;i++){
                            var find = _.findWhere(botUser.brand.historyWriteBlurb, { 'blurbId': req.user.brand.blurbsLastWeek[i].blurbId});
                            //console.log(find);
                            if(find){
                                req.user.brand.blurbsLastWeek[i].SI = find.si;
                            }
                        }
                        var blurbsLastWeek = req.user.brand.blurbsLastWeek;
                        blurbsLastWeek.sort(function(a,b){
                            return b.SI - a.SI;
                        })
                        for(var i=0;i<req.user.brand.blurbsLastMonth.length;i++){
                            var find = _.findWhere(botUser.brand.historyWriteBlurb, { 'blurbId': req.user.brand.blurbsLastMonth[i].blurbId});
                            //console.log(find);
                            if(find){
                                req.user.brand.blurbsLastMonth[i].SI = find.si;
                            }
                        }
                        var blurbsLastMonth = req.user.brand.blurbsLastMonth;
                        blurbsLastMonth.sort(function(a,b){
                            return b.SI - a.SI;
                        })

                        for(var i=0;i<lastMonthTopBlurbers.length;i++){
                            var writer_id = lastMonthTopBlurbers[i].writer_id;
                            var find = _.findWhere('lastMonthTopBlurbers',{'writer_id' : writer_id});
                            if(!find)
                                lastMonthTopBlurbers = _.without(lastMonthTopBlurbers,{'_id': 'writer_id'});
                                var accepted_blurb = _.filter(lastMonthTopBlurbers[i].writer.historyWriteBlurb,function(item){ return item.status == "Accepted"});
                                // console.log(accepted_blurb);

                                if(lastMonthTopBlurbers[i].writer.historyWriteBlurb.length > 0){
                                    acceptance = (accepted_blurb.length/lastMonthTopBlurbers[i].writer.historyWriteBlurb.length)*100;
                                    // console.log('acceptance ' + acceptance);
                                }
                                lastMonthTopBlurbers[i].writer.acceptance = acceptance;
                        }

                        // console.log(lastMonthTopBlurbers);
                        for(var i=0;i<lastMonthTopBlurbers.length;i++){
                            lastMonthTopBlurbers[i].writer.historyWriteBlurb = null;

                        }
                       
                        res.render('users/testAnalytics',{
                        //USER
                            id: req.user._id,
                            name: req.user.name,
                            userType: req.user.userType,
                            logoPath: req.user.logoPath,
                            accountBalance: req.user.brand.accountBalance,
                            RequestRecieve: req.user.brand.RequestRecieve,
                            clients: req.user.brand.clients,
                            campaignBalance: req.user.brand.campaignBalance,
                            historyCallAction: req.user.brand.historyCallAction,
                            historyWriteBlurb: req.user.brand.historyWriteBlurb,
                            twitterFollowersCount: botUser.brand.twitterFollowersCount,
                            facebookSubscribersCount: botUser.brand.facebookSubscribersCount,
                            linkedinFollowersCount: botUser.brand.linkedinFollowersCount,
                            blurbsLastWeek: req.user.brand.blurbsLastWeek,
                            blurbsLastMonth: req.user.brand.blurbsLastMonth,
                            lastMonthTopBlurbers: lastMonthTopBlurbers
                        })

                    }
                    else{

                        res.render('users/testAnalytics',{
                            id: req.user._id,
                            name: req.user.name,
                            userType: req.user.userType,
                            logoPath: req.user.logoPath,
                            accountBalance: req.user.brand.accountBalance,
                            RequestRecieve: req.user.brand.RequestRecieve,
                            clients: req.user.brand.clients,
                            campaignBalance: req.user.brand.campaignBalance,
                            historyCallAction: req.user.brand.historyCallAction,
                            historyWriteBlurb: req.user.brand.historyWriteBlurb,
                            twitterFollowersCount: twitterFollowersCount,
                            facebookSubscribersCount: facebookSubscribersCount,
                            linkedinFollowersCount: linkedinFollowersCount,
                            blurbsLastWeek: req.user.brand.blurbsLastWeek,
                            blurbsLastMonth: req.user.brand.blurbsLastMonth,
                            lastMonthTopBlurbers: lastMonthTopBlurbers
                        })

                    }
              
                   
               
            })

            }
        })




    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({
            '_id': brandIndex
        })
        .exec(function(err,brand){
            res.render('users/analytics',{
                name: req.user.name,
                userType: req.user.userType,
                brandIndex: brandIndex,
                brands: req.user.agency.brands,
                historyWriteBlurb: brand.brand.historyWriteBlurb,
                logoPath: req.user.logoPath,
                brandLogoPath: brand.logoPath,
                accountBalance: brand.brand.accountBalance,
                RequestRecieve: brand.brand.RequestRecieve,
                profile: brand.brand.profileInfo,
                clients: brand.brand.clients



            })
       

        })
    }
    else if(req.user.userType=='writer')
    {
        res.render('users/writerAnalytics',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.writer.historyWriteBlurb,
            historyCallAction: req.user.writer.historyCallAction,
            logoPath: req.user.logoPath,
            accountBalance: req.user.writer.accountBalance,
            RequestRecieve: req.user.writer.RequestRecieve,
            clients: req.user.writer.clients

        })

    }
   

}


exports.writeDefaultBlurbs = function(req,res){

    
    User.find({'writer.profileInfo.name' : {$ne : null}}).select("writer.profileInfo logoPath _id").exec(function(err,writers){
        res.render('users/writeDefaultBlurbs',{
            userType: req.user.userType,
            writers: writers
        })
    })
  
}

exports.writeDefaultBlurbsPost = function(req,res){
    // console.log(req.body);
    var message = req.body.message;
    var option_name = req.body.options.replace(/(\r\n|\n|\r)/gm,""); // remove all whitespace
    console.log('options_name');
    console.log(option_name);
    var date = new Date();
    var imagePath = '';
    var selected_thumbnail = null;
    var writer_id = req.body.writer_id;
    
    if(req.files.image.name){
        fs.readFile(req.files.image.path, function (err, data) {
            fs.writeFile('public/defaultBlurbsImage/' + req.files.image.name,data, function (err) {
                if (err) throw err;
                    fs.unlink(req.files.image.path, function (err){
                        if (err)
                             throw err;
                        else{
                            console.log('file deleted');

                        }
                    }); 
            });
        });
        imagePath = 'defaultBlurbsImage/'+req.files.image.name;

    }
    // console.log(req.body);
    //res.send('ok');
    var des = req.body.message.replace( /\n/g, " " ).split( " " );
    var link;
    var j;
    var reg_url = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ; 

    for(j=0;j<des.length;j++){             
        if(reg_url.test(des[j]))
        {
            link = des[j];
            break;
        }
    }

    if(link){
        link = link.trim(); 
        new embedly({
            key: '16f7a571ba3546f5ba52d638c76b9158'
        }, function(err, api) { api.oembed({ url: link }, function(err, objs) {
            console.log('response from embedly');
            console.log(objs);
            if(objs[0].description==null){
                var previewDescription = '';
            }
            else{
                var previewDescription = objs[0].description.substring(0,135)+'...';
            }
            /*start bitly shortend*/
            bitly.shorten(link, function(error,response){
                if (error)
                    console.log(error);
                var url;
                if(response.data.url){
                    url = response.data.url;
                }
                else{
                    url = link;
                }      
                var description_message = message.replace(reg_url,url);

                defaultBlurb.findOne({'option_name': option_name}).exec(function(err,blurb){
                    
                })

           
            })
            /*end bitly shortend function*/
            if (!!err) {
                console.error(err.stack, objs);
                return;
            }
           
            });
        });
    }
    else{

        User.findOne({'_id' : writer_id}).exec(function(err,user){
            var writer_name = 'Derek';
            var writer_image = 'assets/images/derekblurb.png';
            var id = null; 
                        
            if(!err && user){
                // console.log(user);
                writer_name = user.writer.profileInfo.name;
                writer_image = user.logoPath;
                id = user._id;

            }
            defaultBlurb.findOne({'option_name': option_name}).exec(function(err,blurb){
                if(!err && blurb){

                    blurb.blurbs.push({
                        'writer': {
                            'name' : writer_name,
                            },
                        'date' : date,
                        'path': writer_image,
                        'id': id,
                        'selected_thumbnail': selected_thumbnail,
                        'imagePath' : imagePath,
                        'description' : req.body.message
                    });

                    blurb.save(function(err){
                        if(err)
                            console.log(err);
                    })

                }
                else{

                    var blurb = new defaultBlurb({option_name: option_name});
                    blurb.blurbs.push({
                        'writer': {
                            'name' : writer_name
                            },
                        'description': req.body.message, 
                        'date' : date,
                        'path': writer_image,
                        'id': id,
                        'selected_thumbnail': selected_thumbnail,
                        'imagePath' : imagePath,
                        'description' : req.body.message
                    });

                    blurb.save(function(err){
                        if(err)
                            console.log(err);
                    })
                   

                }
            })
          
        })
  

    }

    res.redirect('/users/writeDefaultBlurbs');
}



exports.testProfile = function(req,res){

    console.log(req.user.userType);
    if(req.user.userType=='brand'){
        
        res.render('users/testProfile',{
            id: req.user._id,
            name: req.user.name,
            userType: req.user.userType,
            historyWriteBlurb: req.user.brand.historyWriteBlurb,
            historyCallAction: req.user.brand.historyCallAction,
            improveProfile: req.user.brand.improveProfile,
            logoPath: req.user.logoPath,
            accountBalance: req.user.brand.accountBalance,
            campaignBalance: req.user.brand.campaignBalance,
            RequestRecieve: req.user.brand.RequestRecieve,
            clients: req.user.brand.clients,
            pricePerBlurb: req.user.brand.pricePerBlurb,
            profile: req.user.brand.profileInfo,
            
           
        })
    }
}


function signupDefaultBlurbs(user_id, interest){

    var message1 = "Wowzers batman, this site offers the best social media content. Check it out: http://www.blurbi.ca" ;
    var date = new Date();
    console.log(interest);
    var interest = interest.replace(/\s+/g, '').trim().split(',');
    var interests_mapping = interestMapping.get_interest_mapping();

    // console.log(interest);

    User.findOne({'_id' : user_id}).exec(function(err,user){
        if(!err && user){
            // console.log(user);
            var options_name = [];
            for(var i=0;i<interest.length;i++){
                if(interest[i]){
                    var find = _.findWhere(interests_mapping,{'interest_name' : interest[i]});
                    var option_name = '';
                    if(find)
                        option_name = find.option_name;
                    user.interestList.push({'interest_name' : interest[i], 'options_name': option_name});
                    if(find){
                        options_name.push(find.option_name);
                    }

                }

            }
            user.save(function(err){
                if(err)
                    console.log(err);
            })
            options_name = _.uniq(options_name);
            //console.log('options_name');
            //console.log(options_name);
            for(var i=0;i<options_name.length;i++){
                (function(i){
                    //console.log('i' + i);
                    //console.log(options_name[i]);
                        
                    defaultBlurb.findOne({'option_name' : options_name[i]}).exec(function(err,defaultBlurb){
                        if(!err && defaultBlurb){  
                            //console.log('defaultBlurb found'); 
                            //console.log(defaultBlurb);  
                            for(var j=0;j<defaultBlurb.blurbs.length;j++){
                                if(user.brand.historyWriteBlurb.length < 9){
                                    user.brand.historyWriteBlurb.push({
                                        'writerIndex': null,
                                        'id': null, 
                                        'writer': defaultBlurb.blurbs[j].writer,
                                        'description': defaultBlurb.blurbs[j].description, 
                                        'path': defaultBlurb.blurbs[j].path, 
                                        'date' : date, 
                                        'price' : 0, 
                                        'seen' : 'unseen',
                                        'linkInfo': defaultBlurb.blurbs[j].linkInfo,
                                        'previewDes': defaultBlurb.blurbs[j].previewDes,
                                        'previewUrl': defaultBlurb.blurbs[j].previewUrl,
                                        'imageName': defaultBlurb.blurbs[j].imageName,
                                        'imagePath': defaultBlurb.blurbs[j].imagePath,
                                    });
                                    user.save(function(err){
                                        console.log(err);
                                    })

                                }

                            }

                        }
                    })

                })(i)
                if(user.brand.historyWriteBlurb.length>7){
                    break;
                }

            }
            if(user.brand.historyWriteBlurb.length < 1){

                    user.brand.historyWriteBlurb.push({
                        'writerIndex': null,
                        'id': null, 
                        'writer': {
                            'name': 'Derek'
                        },
                        'description': message1, 
                        'path': 'assets/images/derekblurb.png', 
                        'date' : date, 
                        'price' : 0, 
                        'seen' : 'unseen'
                    });
                    user.save(function(err){
                        if(err){
                            console.log(err);
                        }
                    })

                        
            }


        }
    })



}

function calculateUserDiscount(promoCode){
    console.log('comes in calculateUserDiscount');

    User.findOne({'promoCode': promoCode}).exec(function(err,user){
        if(!err && user){
            console.log('user found in calculateUserDiscount');
            adminDiscounts.findOne({'code' : 'current'}).exec(function(err,currentDiscount){
                if(!err && currentDiscount){
                    console.log('current discount found');
                    if(currentDiscount.perInvitationFreeDays){
                        console.log('comes here seema');
                        if(!user.freeDays)
                            user.freeDays = 0;
                        user.freeDays += currentDiscount.perInvitationFreeDays;
                        user.perFreeDayDiscount = currentDiscount.perDayDiscount;
                        user.save(function(err){
                            if(err){
                                console.log(err);
                            }
                        }) 
                    }
                }
            })
        }
    })
}

function autoMatch(user_id, interest){
    console.log('comes in autoMatch');
    var interest = interest.toString().replace(/\s+/g, '').trim().split(',');
    var interests_mapping = interestMapping.get_interest_mapping();
    var option_name1 = 'a';
    var option_name2 = 'b';

    User.findOne({'_id': user_id}).exec(function(err,user){
        if(!err && user){
            // console.log(user);
            for(var i=0;i<interest.length;i++){
                (function(i){
                    var option1_find = _.findWhere(interests_mapping,{'interest_name': interest[i]});
                    if(option1_find)
                        option_name1 = option1_find.option_name;
                    if(user.userType=='brand'){
                        User.find({'writer.profileInfo.name': {$ne: null}}).exec(function(err,writers){
                            if(!err && writers.length> 0){
                                console.log('writer found');
                                for(var j=0;j<writers.length;j++){
                                    var find1 = _.findWhere(writers[j].interestList,{'interest_name' : interest[i]});
                                    /* autmatch according to interest name */
                                    if(find1){
                                        if(user.brand.clients.indexOf(writers[j]._id)==-1){
                                            user.brand.clients.push(writers[j]._id);
                                            user.save(function(err){
                                                if(err)
                                                    console.log(err);
                                            })

                                        }
                                      
                                        if(writers[j].writer.clients.indexOf(user._id)==-1){
                                            writers[j].writer.clients.push(user._id);
                                            writers[j].save(function(err){
                                                if(err)
                                                    console.log(err);
                                            })
                                            console.log('there comes jkjkajsdklfjalsjf');
                                            console.log(user.brand.profileInfo.company);
                                            emailForNewBuyer(user.brand.profileInfo.company,writers[j].name, writers[j].email, writers[j]._id);

                                        }
                                      
                                    }
                                    /* automatch according to option name */
                                    else{

                                        var find2 = _.findWhere(writers[j].interestList,{'option_name' : option_name1});
                                        if(find2){
                                            if(user.brand.clients.indexOf(writers[j]._id)==-1){
                                                user.brand.clients.push(writers[j]._id)
                                                user.save(function(err){
                                                    if(err)
                                                        console.log(err);
                                                })

                                            }
                                            
                                            if(writers[j].writer.clients.indexOf(user._id)==-1){
                                                writers[j].writer.clients.push(user._id)
                                                writers[j].save(function(err){
                                                    if(err)
                                                        console.log(err);
                                                })
                                                emailForNewBuyer(user.brand.profileInfo.company,writers[j].name, writers[j].email, writers[j]._id);

                                            }
                                          

                                        }

                                    }


                                }
                            }
                        })

                    }
                    else{
                        User.find({'userType': 'brand'}).exec(function(err,brands){
                            if(!err && brands.length> 0){
                                console.log('found brands');
                                for(var j=0;j<brands.length;j++){
                                    var find1 = _.findWhere(brands[j].interestList,{'interest_name' : interest[i]});
                                    /* autmatch according to interest name */
                                    if(find1){

                                        if(user.writer.clients.indexOf(brands[j]._id)==-1){
                                            user.writer.clients.push(brands[j]._id);
                                            user.save(function(err){
                                                if(err)
                                                    console.log(err);
                                            })
                                            emailForNewBuyer(brands[j].brand.profileInfo.company,user.name, user.email, user._id);
                                            

                                        }
                                        if(brands[j].brand.clients.indexOf(user._id)!=-1){
                                            brands[j].brand.clients.push(user._id);
                                            brands[j].save(function(err){
                                                if(err)
                                                    console.log(err);
                                            })

                                        }
                                       
                                       
                                        
                                    }
                                    /* autmatch according to option name */
                                    else{
                                        var find2 = _.findWhere(brands[j].interestList,{'option_name' : option_name1});
                                        if(find2){
                                            if(user.writer.clients.indexOf(brands[j]._id)==-1){
                                                user.writer.clients.push(brands[j]._id);
                                                user.save(function(err){
                                                    if(err)
                                                        console.log(err);
                                                })
                                                emailForNewBuyer(brands[j].brand.profileInfo.company,user.name, user.email, user._id);
                                                

                                            }
                                            if(brands[j].brand.clients.indexOf(user._id)!=-1){
                                                brands[j].brand.clients.push(user._id);
                                                brands[j].save(function(err){
                                                    if(err)
                                                        console.log(err);
                                                })

                                            }
                                        }

                                    }
                                }
                            }
                        })

                    }


                })(i)
            }



        }
    })

}


exports.adminAutoClients = function(req,res){

    User.find({'brand.profileInfo.company' : {$ne: null}}).select("_id brand.profileInfo logoPath").exec(function(err,brands){
        User.find({'writer.profileInfo.name' : {$ne: null}}).select("_id writer.profileInfo logoPath").exec(function(err,writers){
            // console.log(brands);
            // console.log(writers);
            res.render('users/adminAutoClients',{
                userType: req.user.userType,
                brands: brands,
                writers: writers
            })

        })
    })

   
}

exports.autoClientsPost = function(req,res){

    console.log(req.body);
    var brand_id = req.body.brand;
    var writer_id = req.body.writer;

    User.findOne({_id: brand_id}).exec(function(err,brand){
        if(!err && brand){
            User.findOne({_id: writer_id}).exec(function(err,writer){
                if(!err && writer){
                    var uniq1 = _.uniq(brand.brand.clients.push(writer._id));
                    brand.save(function(err){
                        if(err){
                            console.log(err);
                        }
                    })
                    var uniq2 = _.uniq(writer.writer.clients.push(brand._id));
                    writer.save(function(err){
                        if(err){
                            console.log(err);
                        }
                    })
                }
            })
        }
    })
    res.send('ok');
}

exports.addPromoCode = function(req,res){
    adminDiscounts.findOne({'code': 'current'}).exec(function(err,currentDiscount){
        if(!err){
            res.render("users/addPromoCode", {
                userType: req.user.userType,
                currentDiscountPolicy: currentDiscount
            })

        }
    })
   
}
exports.addDiscountPolicy = function(req,res){
    console.log(req.body);

    adminDiscounts.findOne({'code' : 'current'}).exec(function(err,currentDiscount){
        if(!err && currentDiscount){
            currentDiscount.discountType = req.body.discountType;
            currentDiscount.discountText = req.body.discountText;
            if(req.body.discountType=='Percentage'){
                currentDiscount.perInvitationDiscount = req.body.perInvitationDiscount;
            }
            else{
                currentDiscount.perDayDiscount = req.body.perDayDiscount;
                currentDiscount.perInvitationFreeDays = req.body.perInvitationFreeDays;
            }
            currentDiscount.save(function(err){
                if(err)
                    console.log(err);
            })

        }
        else{

            var currentDiscount = new adminDiscounts({'code' : 'current'});
            currentDiscount.discountType = req.body.discountType;
            currentDiscount.discountText = req.body.discountText;
            if(req.body.discountType=='Percentage'){
                currentDiscount.perInvitationDiscount = req.body.perInvitationDiscount;
            }
            else{

                currentDiscount.perDayDiscount = req.body.perDayDiscount;
                currentDiscount.perInvitationFreeDays = req.body.perInvitationFreeDays;
            }
            currentDiscount.save(function(err){
                if(err)
                    console.log(err);
            })
        }
    })
    res.send('ok');
}
exports.ifPostIsAllowed = function(req,res){
    var id = req.body.id;
    if(req.user.userType=='brand'){
        var find = _.filter(req.user.brand.historyWriteBlurb,function(item){ return item._id == id});
        var fg = 0;
        var cg = 0;
        if(find.length > 0){
            brandBlurb = find[0];
            if(find[0].ctaId){
                    var findCTA=_.filter(req.user.brand.historyCallAction,function(item){return item._id== brandBlurb.ctaId});
                    if(findCTA[0].perCampaignAmount > brandBlurb.price){
                        res.send('allowed');
                    }
                    else{
                        cg = 1;
                    }

            }
            if(cg==1 || !find[0].ctaId){

                if(req.user.freeDays > 0 ){
                   
                    var remainingPerFreeDiscount = req.user.perFreeDayDiscount - req.user.numberOfPost.charge;
                    if(remainingPerFreeDiscount > brandBlurb.price || remainingPerFreeDiscount == brandBlurb.price){
                        fg=1;
                    }
                      
                }
                if(req.user.stock_accountBalance > 0 ){
                    if(req.user.stock_accountBalance > brandBlurb.price || req.user.stock_accountBalance== brandBlurb.price){
                       fg=1;
                    }


                }
                if(req.user.brand.accountBalance > brandBlurb.price || req.user.brand.accountBalance == brandBlurb.price){
                    fg =1;
                }
                if(fg == 1){
                 
                    if(cg ==1)
                        res.send('campaign balance low')
                    else
                        res.send('allowed');
                    
                }
                else if(fg == 0){
                    res.send('not allowed');
                   
                }
                    

            }
        }
    }
    else if(req.user.userType=='agency'){
        var brandIndex = req.session.brandIndex;
        User.findOne({'_id' : brandIndex}).exec(function(err,user){
            if(!err && user){
                var find = _.filter(user.brand.historyWriteBlurb,function(item){ return item._id == id});
                var fg = 0;
                var cg = 0;
                if(find.length > 0){
                    brandBlurb = find[0];
                    if(find[0].ctaId){
                            var findCTA=_.filter(user.brand.historyCallAction,function(item){return item._id== brandBlurb.ctaId});
                            if(findCTA[0].perCampaignAmount > brandBlurb.price){
                                res.send('allowed');
                            }
                            else{
                                cg = 1;
                            }

                    }
                    if(cg==1 || !find[0].ctaId){

                        if(user.freeDays > 0 ){
                           
                            var remainingPerFreeDiscount = user.perFreeDayDiscount - user.numberOfPost.charge;
                            if(remainingPerFreeDiscount > brandBlurb.price || remainingPerFreeDiscount == brandBlurb.price){
                                fg=1;
                            }
                              
                        }
                        if(user.stock_accountBalance > 0 ){
                            if(user.stock_accountBalance > brandBlurb.price || user.stock_accountBalance== brandBlurb.price){
                               fg=1;
                            }


                        }
                        if(user.brand.accountBalance > brandBlurb.price || user.brand.accountBalance == brandBlurb.price){
                            fg =1;
                        }
                        if(fg == 1){
                         
                            if(cg ==1)
                                res.send('campaign balance low')
                            else
                                res.send('allowed');
                            
                        }
                        else if(fg == 0){
                            res.send('not allowed');
                           
                        }
                            

                    }
                }
            }
        })
    }
}

function discountForEachTopUp(promoCode, amount){
    // console.log('comes in calculateUserDiscount');

    User.findOne({'promoCode': promoCode}).exec(function(err,user){
        if(!err && user){
            // console.log('user found in calculateUserDiscount');
            adminDiscounts.findOne({'code' : 'current'}).exec(function(err,currentDiscount){
                if(!err && currentDiscount){
                    // console.log('current discount found');
                    if(currentDiscount.perInvitationDiscount > 0){
                        // console.log('comes here seema');
                        if(!user.stock_accountBalance)
                            user.stock_accountBalance = 0;
                        var discount = amount * (currentDiscount.perInvitationDiscount/100);
                        user.stock_accountBalance += discount;
                        user.save(function(err){
                            if(err){
                                console.log(err);
                            }
                        }) 
                    }
                }
            })
        }
    })
}

function emailForNewBuyer(Buyer,name,email,user_id){
    User.findOne({'_id' : user_id}).exec(function(err,user){
        if(!err && user){
            if(user.isUnsubscribed!=true){
                var changed_link = unsub_link + 'user_id=' + user._id;
                mandrill('/messages/send-template', {
                    "template_name" : "Writer: New Buyer",
                    "template_content" :  [
                    ]  ,
                    "message": {
                        to: [{
                            email: email
                            }],
                        from_email: 'derek@blurbi.ca',
                        subject: "New Buyer!",
                        "merge": true,
                        "merge_vars": [
                        {
                            "rcpt": email,
                            "vars": [
                                {
                                    "name": "name",
                                    "content": name                                    
                                },
                                {
                                    "name": "Buyer",
                                    "content": Buyer
                                },
                                {
                                    "name": "UNSUB",
                                    "content": changed_link
                                }
                            ]
                        }
                        ],
                    },
                }, function(error, response){
                    //console.log("djfksdf");
                    //uh oh, there was an error
                    if (error) console.log( JSON.stringify(error) );
                    //everything's good, lets see what mandrill said
                    else console.log(response);
                    //console.log("HERE");
                });

            }
          

        }
    })
        

}

function editInterestList(user_id, interest){
    // console.log('comes in editdInterestList fasdf');
    User.findOne({'_id': user_id}).exec(function(err,user){
        if(!err && user){
            user.interestList = [];
            //console.log(user);
            // var inteterst_list = new Array();
            interest = interest.replace(/\s+/g, '').trim().split(',');
            var interests_mapping = interestMapping.get_interest_mapping();
            for(var i=0;i<interest.length;i++){
                if(interest[i]){
                    // console.log('interest');
                    // console.log(interest[i]);
                    var find = _.findWhere(interests_mapping,{'interest_name' : interest[i]});
                    var option_name = '';
                    if(find)
                        option_name = find.option_name;
                    user.interestList.push({'interest_name' : interest[i], 'option_name': option_name});

                }

            }
         
            user.save(function(err){
                if(err)
                    console.log(err);
            })
        }
    })
}



