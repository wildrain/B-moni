/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
crypto = require('crypto'),
uuid = require('node-uuid'),
authTypes = [ 'twitter', 'facebook', 'bufferapp'],
UserSchema,
blurbiDBConnection;


/**
 * User Schema
 */



exports.CREATE_BLURBIDB_CONNECTION=function(){
  UserSchema = mongoose.Schema({
    
    interestList: [{
      'interest_name' : String,
      'option_name' : String
    }],
    promoCode: String,
    isUnsubscribed: {type: Boolean, default: false},
    freeDayCalculationDate: String,
    freeDays: {type: Number, default: 0}, //reamaining numb of days user get free content
    perFreeDayDiscount: {type: Number, default: 0}, // per day $ limit 
    numberOfPost: {
      date: String,
      charge: {type: Number, default: 0}
    },
    stock_accountBalance: {type: Number, default: 0},
    validationCode: String,
    salt: { type: String, required: true, default: uuid.v1 },
    valid: { type: Boolean, default: false},
    name: String,
    email: String,
    password: String,
    lastLogin: Date,
    facebook: {},
    facebookAccessToken: {},
    twitter: {},
    twitterAccessToken: String,
    twitterAccessTokenSecret: String,
    bufferapp: {},
    bufferappAccessToken: String,
    bufferappRefreshToken: String,
    linkedin: {},
    linkedinAccessToken: String,
    linkedinRefreshToken: String,
    provider: String,
    userType: String,
    brandType: String,
    writerType: String,
    enterpriseAddress: String,
    logoPath: {type: String, default: null},
    backupLogoPath: {type: String, default: null},
    paypal: [{
      id: String,
      payment: String

    }],
    profileSet: {type: Boolean, default: false},
    uncheckAlert: {type: Boolean, default: false},
    facebookPostPageType: {type: String, default: 'profile'},
    twitterPostPageType: {type: String, default: 'profile'},
    linkedinPostPageType: {type: String, default: 'profile'},
    facebookGroupInfo: {},
    facebookPageInfo: {},
    twitterListInfo: {},
    linkedinGroupInfo: {},
    linkedinCompanyInfo: {},

    admin: {
      writerRequest: [{
        name: String,
        email: String,
        password: String,
        writerProfile: {},
        facebook: {},
        facebookAccessToken: {},
        twitter: {},
        twitterAccessToken: String,
        twitterAccessTokenSecret: String,

      }],

      historyInvoiceAction: [{
        userId: String,
        campaignId: String,
        company: String,
        invoiceAmount: {type: Number, default: 0},
        invoiceIndexNo: {type: Number, default: 0},
        depositedAmount: {type: Number, default: 0},
        campaignTitle: String
      }],

      invoiceIndexNo: {type: Number, default: 1},
      
      historyWriteBlurb: [{
            id: String,
            companyName: String,
            writerName: String,
            path: String,
            date: String,
            description: String,
            writer: {},
            status: {type: String, default: 'Pending'},
            si: String,
            remove: String,
            price: {type: Number, default: 0},
            writerIndex: String,
            participate: String,
            seen: {type: String, default: 'unseen'},
            facebookPostId: String,
            twitterPostId: String,
            linkedinPostId: String,
            deleteStatus: String,
            linkInfo: {},
            previewDes: String,
            previewUrl: String,
            imageName: String,
            imagePath: String,
            scheduleTime: String,
            facebook:String,
            twitter:String,
            linkedin:String,
            post:String,
            ctaId: String,
            chargeFrom: {type: String, default: 'general'} //from where cash will be deduct
      }],





      emails: []
    },

    joiningDate: String,
    addedToBotDB: {type: Boolean, default:false},

    brand: {
      profileInfo: {
        promoCode: String,
        localCity: String,
        customerCountry: String,
        customerCountryFlag: String,
        country: String,
        countryFlag: String,
        interest: String,
        description: String,
        company: String,
        companyUrl: String,
        range1: {type: Number, default: 0},
        range2: {type: Number, default: 0},
        voice1: String,
        voice2: String,
        voice3: String, 
        email: String,
        emulatePage: {
          emulatePage1: String,
          emulatePage2: String,
          emulatePage3: String,
          emulatePage4: String,
          emulatePage5: String,
          emulatePage6: String,
          emulatePage7: String,
          emulatePage8: String

        }      

      },
      historyCallAction: [{
        title: String,
        description: String,
        projectBrief: String, 
        startDatepicker:String,
        datepicker : String, 
        date : Date, 
        eventType : String,
        price : String,
        perResponse: String,
        perCampaignAmount: {type: Number, default: 0},
        filePath: String,
        status : {'type' : String, default: 'Pending'}, 
        seen : {'type' : String, default: 'unseen'} ,
        writers: [],
        writersDenied: [],
        deleteStatus: String,
        editStatus: {'type' : String, default: 'No'},

      }],

      improveProfile: {
        
      },

      historyWriteBlurb: [{
            id: String,
            path: String,
            date: String,
            description: String,
            writer: {},
            status: {type: String, default: 'Pending'},
            si: {type: Number, default: 0},
            remove: String,
            price: {type: Number, default: 0},
            writerIndex: String,
            participate: String,
            seen: {type: String, default: 'unseen'},
            facebookPostId: String,
            twitterPostId: String,
            linkedinPostId: String,
            deleteStatus: String,
            linkInfo: {},
            previewDes: String,
            previewUrl: String,
            imageName: String,
            imagePath: String,
            scheduleTime: String,
            facebook:String,
            twitter:String,
            linkedin:String,
            facebookAccessToken: String,
            twitterAccessToken: String,
            twitterAccessTokenSecret: String,
            linkedinAccessToken: String,
            post:String,
            postingLastDate: Date,
            ctaId: String,
            selected_thumbnail: String,
            chargeFrom: {type: String, default: 'general'} //from where cash will be deduct
      }],

      accountBalance: {type: Number, default: 0},
      campaignBalance: {type: Number, default: 0},
      RequestRecieve: [{
        id : String, 
        name: String, 
        logoPath : String, 
        'seen' : {type: String, default: 'unseen'}
      }],
      RequestSend: [],
      clients: [],
      internalClients: [
        
      ],
      pricePerBlurb: {type: Number, default: 1},
      pricePerResponse: {type: Number, default: 1},
      emailSettings: [],
      logoPath: String,
      facebookOn: {type: Boolean, default: true},
      twitterOn: {type: Boolean, default: true},
      bufferOn: {type: Boolean, default: true},
      linkedinOn: {type: Boolean, default: true},
      seenBlurbIndex: String,
      lastDate: Date, //last date user was in the blurbi
      lastProcessDayForMail: Date,
      ifWritersNotified: { type: Boolean, default: false},
      blurbsLastWeek: [{
        writer: {
          type: Schema.ObjectId,
          ref: 'User'
        },
        SI: {type: Number, default: 0},
        description: String,
        date: Date,
        blurbId: String,
        writer_name: String,
        writer_id: String,
        writer_image: String

      }],
      blurbsLastMonth: [{
        writer: {
          type: Schema.ObjectId,
          ref: 'User'
        },
        SI: {type: Number, default: 0},
        description: String,
        date: Date,
        blurbId: String,
        writer_name: String,
        writer_id: String,
        writer_image: String
        
      }],




    },

    writer: {
         profileInfo: {

          writerInfo: String,
          name: String,
          twitter_name: String,
          linkedin_name: String,
          Age: String,
          interest: String,
          location: String,
          country: String,
          countryFlag: String,
          radio: String
         
         },
          historyWriteBlurb: [{

            id: String,
            path: String,
            date: Date,
            description: String,
            writer: {},
            status: {type: String, default: 'Pending'},
            si: String,
            remove: String,
            price: {type: Number, default: 0},
            writerIndex: String,
            participate: String,
            seen: {type: String, default: 'unseen'},
            //facebookPostId: String,
            //twitterPostId: String,
            //linkedinPostId: String,
            
            expiredate: Date,
            brand: String,
            brandList: [],
            deleteStatus: String,
            linkInfo: [],
            ctaId: String,
            
          }],


          RequestRecieve: [{
            id : String, 
            name: String, 
            logoPath : String, 
            'seen' : {type: String, default: 'unseen'}
          }],
          RequestSend: [],
          clients: [],
          accountBalance: {type: Number, default: 0},
          campaignBalance: {type: Number, default: 0},
          historyCallAction: [{
             id: String,
             logoPath: String,
             brand: {'company' : String},
             title: String,
             description: String, 
             projectBrief: String, 
             filePath: String,
             datepicker : String, 
             date : Date,
             price: {type: Number, default: 0}, 
             status : {'type' : String, default: 'Pending'}, 
             seen : {'type' : String, default: 'unseen'} ,
             editStatus: {'type' : String, default: 'No'},
             brandCallId: String,
             
          }],
          writerPerticipated: [],
          emailSettings: [],
          signup: {type: Boolean, default: false}
        },

      agency: {
          profileInfo: {
            company: String,
            country: String
           
          },
          brands: [{
            id: String,
            company: String,
            logoPath: String
          }],
          facebook: {},
          facebookAccessToken: {},
          twitter: {},
          twitterAccessToken: String,
          twitterAccessTokenSecret: String,
          bufferapp: {},
          bufferappAccessToken: String,
          bufferappRefreshToken: String,
          emailSettings: []

          
      }

  }, {strict: false});

  var hash = function(passwd, salt) {
    return crypto.createHmac('sha256', salt).update(passwd).digest('hex');
  };

  UserSchema.methods.setPassword = function(passwordString) { 
    this.password = hash(passwordString, this.salt);
  };

  UserSchema.methods.isValidPassword = function(passwordString) {
    return this.password === hash(passwordString, this.salt);
  };

  blurbiDBConnection = mongoose.createConnection('mongodb://localhost/blurbi');
  blurbiDBConnection.model('User', UserSchema);
  console.log("USER DB CREATED");

  var defaultBlurb_schema = mongoose.Schema({

    interest_name: String,
    option_name: String,
    blurbs: [{

      id: { type: String, default: null},
      path: { type: String, default: 'assets/images/derekblurb.png'},
      date: String,
      description: String,
      writer: {},
      status: {type: String, default: 'Pending'},
      si: {type: Number, default: 0},
      remove: String,
      price: {type: Number, default: 0},
      writerIndex: {type: String, default: null},
      seen: {type: String, default: 'unseen'},
      facebookPostId: String,
      twitterPostId: String,
      linkedinPostId: String,
      deleteStatus: String,
      linkInfo: {},
      previewDes: String,
      previewUrl: String,
      imageName: String,
      imagePath: String,
      scheduleTime: String,
      facebook:String,
      twitter:String,
      linkedin:String,
      facebookAccessToken: String,
      twitterAccessToken: String,
      twitterAccessTokenSecret: String,
      linkedinAccessToken: String,
      post:String,
      postingLastDate: Date,
      ctaId: String,
      selected_thumbnail: String,
      chargeFrom: {type: String, default: 'general'} //from where cash will be deduct
    }]

  },{strict: false})

  blurbiDBConnection.model('defaultBlurb', defaultBlurb_schema);

  var brandOwnBlurb = mongoose.Schema({

      creator: {type: Schema.ObjectId },
      brandId: {type: String, default: null},
      id: { type: String, default: null},
      path: { type: String, default: null},
      date: String,
      description: String,
      si: {type: Number, default: 0},
      price: {type: Number, default: 0},
      writerIndex: {type: String, default: null},
      scheduleTime: String,
      facebook:String,
      twitter:String,
      linkedin:String,
      post:String,
      postingLastDate: Date,


  },{strict: false})

  blurbiDBConnection.model('brandOwnBlurb', brandOwnBlurb);

  var adminDiscounts = mongoose.Schema({

    code: String,
    discountType: String,
    discountText: String,
    perDayDiscount: Number,
    perInvitationFreeDays: Number,
    perInvitationDiscount: Number

  },{strict: false});

  blurbiDBConnection.model('adminDiscounts', adminDiscounts);


}

exports.GET_BLURBIDB_CONNECTION=function(){
  return blurbiDBConnection;
}


