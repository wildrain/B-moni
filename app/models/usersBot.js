/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
usersBotSchema,
blurbiBotDBConnection;

exports.CREATE_BLURBIBOTDB_CONNECTION=function(){
    usersBotSchema=mongoose.Schema({
        blurbiId: String,
        name: String,
        userType: String,
        facebookAccessToken: String,
        twitterAccessToken: String,
        twitterAccessTokenSecret: String,
        linkedinAccessToken: String,
        linkedinRefreshToken: String,
        joiningDate: String,
        email: String,
        logoPath: {type: String, default: null},

        brand:{
            historyWriteBlurb:[{
                blurbId: String,
                id: String,
                date: String,
                price: Number,
                status: String,
                description: String,
                //writerId: String,
                writerIndex: String,
                facebookPostId: String,
                twitterPostId: String,
                linkedinPostId: String,
                linkedinPostCommentCount: String,
                facebookAccessToken: String,
                twitterAccessToken: String,
                twitterAccessTokenSecret: String,
                linkedinAccessToken: String,
                si: {type: Number, default: 0},
                facebookLikeCount: {type: Number, default: 0},
                facebookCommentCount: {type: Number, default: 0},
                facebookShareCount: {type: Number, default: 0},
                tweetRetweetCount: {type: Number, default: 0},
                tweetFavoriteCount: {type: Number, default: 0},
                linkedinLikeCount: {type: Number, default: 0},
                linkedinCommentCount: {type: Number, default: 0},
                postingLastDate: Date


            }],

            
            totalSI:[{
                count: {type: Number, default: 0},
                date: String
            }],
            facebookSubscribersCount: [{
                count: {type: Number, default: 0},
                date: String
            }],
            twitterFollowersCount: [{
                count: {type: Number, default: 0},
                date: String
            }],
            linkedinFollowersCount: [{
                count: {type: Number, default: 0},
                date: String
            }],
            profileInfo: {},
            acceptance: {type: Number, default: 0}
        },

        writer:{
            historyWriteBlurb: [{
                blurbId: String,
                date: String,
                price: Number,
                status: String,
                description: String,
                si: {type: Number,default: 0}
            }],
            totalSI:[{
                count: {type: Number,default: 0},
                date: String
            }],
            profileInfo: {},
            acceptance: {type: Number, default: 0},
            accountBalance: {type: Number, default: 0}
        }
    },{strict: false});

    blurbiBotDBConnection=mongoose.createConnection('mongodb://localhost/blurbibot');
    blurbiBotDBConnection.model('usersbot',usersBotSchema);
    console.log("USER BOT DB CREATED");
}


exports.GET_BLURBIBOTDB_CONNECTION=function(){
    return blurbiBotDBConnection;
}