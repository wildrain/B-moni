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
adminDiscounts = blurbiCon.model('adminDiscounts'),
blurbiBotCon=conns.blurbiBotDBConnection,
usersBot=blurbiBotCon.model('usersbot'),
promo = require("../../config/promo");
var discounts = promo.promoCode();

exports.payForPost = function(userId,writerId,blurbId){
    var writerBlurb;
    var brandBlurb;
    console.log('comes in payment function');

    User.findOne({'_id' : userId}).exec(function(err,user){
        if(!err && user){
            // console.log('found user');
            User.findOne({'_id': writerId}).exec(function(err,writer){
                if(!err && writer){
                    // console.log('found writer');
                    // console.log(blurbId);
                    brandBlurb = _.filter(user.brand.historyWriteBlurb, function(item){
                        return item._id == blurbId.toString(); 
                    });
                    // console.log('brandBlurb');
                    // console.log(brandBlurb);
                    if(brandBlurb.length > 0 ){
                        // console.log(brandBlurb);
                        brandBlurb = brandBlurb[0];
                        var writerIndex = brandBlurb.writerIndex;
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
                       
                        if(brandBlurb.status!='Accepted'){
                           
                            var fg=0;
                            writerBlurb.status='Accepted';
                            brandBlurb.status='Accepted';
                            var today = new Date();
                            if(user.brand.profileInfo.promoCode!='blurbi_salesMarketer2014'){
                                writer.writer.accountBalance = writer.writer.accountBalance + brandBlurb.price*(0.8);
                                writerBlurb.price += brandBlurb.price*(0.8);
                                if(user.freeDays > 0 && fg==0){
                                    if(user.numberOfPost.date!=today.toDateString()){
                                        user.numberOfPost.charge = 0;
                                        user.numberOfPost.date = today.toDateString();
                                        user.save(function(err){
                                            console.log(err);
                                        })
                                    }
                                    var remainingPerFreeDiscount = user.perFreeDayDiscount - user.numberOfPost.charge;
                                    if(remainingPerFreeDiscount > brandBlurb.price || remainingPerFreeDiscount == brandBlurb.price){
                                        user.numberOfPost.charge += brandBlurb.price;
                                        fg=1;
                                    }
                                  
                                }
                                if(user.stock_accountBalance > 0 && fg==0){
                                    if(user.stock_accountBalance > brandBlurb.price || user.stock_accountBalance== brandBlurb.price){
                                        user.stock_accountBalance -= brandBlurb.price;
                                        fg = 1;
                                    }


                                }
                                if(fg==0){
                                    if(brandBlurb.ctaId){
                                        var findCTA=_.filter(user.brand.historyCallAction,function(item){return item._id== brandBlurb.ctaId});
                                       // console.log(findCTA);
                                        if(findCTA[0].perCampaignAmount > brandBlurb.price || findCTA[0].perCampaignAmount == brandBlurb.price){
                                            user.brand.campaignBalance = user.brand.campaignBalance - brandBlurb.price;
                                            findCTA[0].perCampaignAmount = findCTA[0].perCampaignAmount - brandBlurb.price;
                                        }
                                        else{
                                            user.brand.accountBalance = user.brand.accountBalance - brandBlurb.price;
                                        }
                                    }
                                    else{
                                            user.brand.accountBalance = user.brand.accountBalance - brandBlurb.price;
                                    }


                                }
                                user.save(function(err){
                                    if (err)
                                        console.log(err);
                                })
                                writer.save(function(err){
                                    if(err)
                                        console.log(err);
                                })
                                

                            }
                  
                        }

                    }


                }
            })
        }
    })

}

