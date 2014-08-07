var async = require('async')
, facebook= require('../app/controllers/facebook')
, twitter= require('../app/controllers/twitter')
, linkedin =  require('../app/controllers/linkedin')
, request = require('request') //HTTP request client
, fs = require('fs')
, FormData = require('form-data') //Pretty multipart form maker.
, https = require('https');

module.exports = function (app,passport,auth) {

  // user routes
  var users = require('../app/controllers/users');

  // home route
  var index = require('../app/controllers/index');
  users.init();


  app.get('/users/scheduled',users.scheduled);
  app.get('/enterprisesignup',users.getEnterpriseSignup);
  app.get('/userlogin',users.getLogin);
  app.get('/usersignup',users.getSignup);
  app.get('/writers',users.getWriters);
  app.get('/writerRegistrationSuccess',users.writerRegistrationSuccess);
  app.post('/writerRegistration',users.writerRegistrationPost);
  app.get('/signout',users.signout);
  app.get('/', index.render);
  app.get('/terms' , users.terms);
  app.get('/policy', users.policy);
  app.get('/brandSignup1', auth.requiresLogin, users.brandSignup1);
  app.get('/writerSignup1',auth.requiresLogin,users.writerSignup1);
  app.get('/agencySignup1', auth.requiresLogin, users.agencySignup1);
  app.get('/agencySignup2',auth.requiresLogin,users.agencySignup2);
  app.get('/linkTo',auth.requiresLogin,users.linkTo);
  app.get('/selectPage',auth.requiresLogin,users.selectPage);
  app.post('/selectPage', auth.requiresLogin, users.selectPagePost);
  app.post('/deselectPage', auth.requiresLogin, users.deselectPage);
  app.get('/agencylinkTo',auth.requiresLogin,users.agencylinkTo);
  app.get('/auth/facebook', passport.authenticate('facebook', { scope: [ 'email', 'user_about_me', 'read_stream', 'publish_actions', 'user_friends', 'manage_pages', 'user_groups'], failureRedirect: '/' }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), users.authCallback);
  app.get('/users/home',auth.requiresValid,users.home);
  app.get('/auth/twitter', passport.authenticate('twitter', { failureRedirect: '/' }));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }), users.authCallback);
  app.get('/auth/linkedin',passport.authenticate('linkedin', {scope: ['r_emailaddress','r_basicprofile','rw_nus','r_contactinfo', 'rw_groups', 'rw_company_admin'], state: 'DCEEFWF45453sdffef424' }));
  app.get('/auth/linkedin/callback',passport.authenticate('linkedin', { failureRedirect: '/' }),users.authCallback);
  app.get('/users/brandContent',auth.requiresValid, users.brandContent);
  app.get('/users/writerContent',auth.requiresValid, users.writerContent);
  app.get('/users/callAction',auth.requiresValid,users.callAction);
  app.get('/users/analytics', auth.requiresValid,users.analytics);
  app.get('/users/TopUpAccount',auth.requiresValid,users.TopUpAccount);
  app.get('/users/changePricing',auth.requiresValid,users.changePricing);
  app.get('/users/browseClients',auth.requiresValid,users.browseClients);
  app.get('/users/settings',auth.requiresValid,users.settings);
  app.get('/users/profile',auth.requiresValid,users.getProfile);
  app.get('/users/adminPage',auth.requiresValid,users.adminPage);
  app.get('/users/writeBlurbs',auth.requiresValid,users.writeBlurbs);
  app.get('/ret',users.ret);
  app.get('/users/acc',users.acc);
  app.get('/users/facebookSignup',users.facebookSignup);
  app.get('/users/agencyBrandProfile',auth.requiresValid,users.agencyBrandProfile);
  app.get('/users/agencyBrandLinkTo',auth.requiresValid,users.agencyBrandLinkTo);
  app.get('/users/seeProfile',auth.requiresValid,users.seeProfile);
  app.get('/users/brandBlurbi',auth.requiresValid,users.brandBlurbi);
  app.get('/users/unsubscribe',users.unsubscribe);
  app.get('/users/redirectChangePassword', users.redirectChangePassword);
  app.get('/users/redirectLogin', users.redirectLogin);
  app.get('/signupModal',users.signupModal);
  app.get('/users/addBrands',users.addBrands);
  app.get('/users/FAQuser',users.FAQuser);
  app.get('/users/Feedback',users.Feedback);
  app.get('/logo',users.logorender);
  app.get('/users/deactivate', auth.requiresLogin, users.deactivate);
  //app.get('/test_embedly',users.test_embedly);
  app.post('/users/testlogo',users.testlogo);
  app.post('/users/agencyBrandTestLogo',users.agencyBrandTestLogo);
  app.post('/setScheduleTime',users.setScheduleTime);
  app.post('/setscheduleTimeOwnBlurb',users.setscheduleTimeOwnBlurb);
  app.post('/setRescheduleTime',users.setRescheduleTime);
  //app.post('/setAgencyScheduleTime',users.setAgencyScheduleTime);
  app.get('/users/enterprise',users.enterprise);
  app.get('/users/brandcontentshow',users.brandContentShow);
  app.get('/users/transactions',users.transactions);
  app.get('/users/sitestats',users.sitestats);
  app.get('/users/adminBrowseBrands',users.adminBrowseBrands);
  app.get('/users/activeAccount',users.activeAccount);
  app.get('/dummyForCallback',users.dummyForCallback);
  app.get('/activatedAccount', users.activatedAccount);
  app.get('/users/modal',users.modal);
  app.get('/users/browseWriters',users.browseWriters);
  app.get('/users/testProfile',users.testProfile);




  app.post('/users/addWriters', users.addWriters);
  app.post('/users/registration', users.registration);
  app.post('/users/twitterSignup',users.twitterSignup);
  app.post('/users/brandContent',users.brandContentPost);
  app.post('/users/callAction',users.callActionPost);
  app.post('/users/logo',users.logo);
  app.post('/users/agencylogo',users.agencylogo);
  app.post('/users/signup',users.signup);
  app.post('/emailAvailability',users.emailAvailability);
  app.post('/brandSignup1',users.brandSignup1Post);
  app.post('/writerSignup1',users.writerSignup1Post);
  app.post('/agencySignup1',users.agencySignup1Post);
  app.post('/agencySignup2',users.agencySignup2Post);
  app.post('/users/writerRegistrationAccept',users.writerRegistrationAccept);
  app.post('/users/session', passport.authenticate('local', {failureRedirect: '/userlogin#loginError', failureFlash: 'Invalid email or password.'}), users.home);
  app.post('/users/writeBlurbs/:taglist',users.writeBlurbsPost);
  app.post('/users/participate',users.participate);
  app.post('/users/paypalPayment',users.paypalPayment);
  app.post('/users/payment',users.recieve);
  app.post('/users/messageSeen',users.messageSeen);
  app.post('/users/facebook/post', facebook.postMessage);
  app.post('/facebook/getInfo', facebook.getInfo);
  app.post('/linkedin/getInfo', linkedin.getInfo);
  app.post('/users/twitter/post',twitter.postMessage);
  app.post('/users/linkedin/post',linkedin.postMessage);
  app.post('/users/checkPassword',users.checkPassword);
  app.post('/users/changePassword',users.changePassword);
  app.post('/users/changePricing',users.changePricingPost);
  app.post('/forgotPassword',users.forgotPassword);
  app.post('/users/profile',users.editProfile);
  app.post('/users/agencyBrandProfile', users.editAgencyBrandProfile);
  app.post('/users/changeSettings',users.changeSettings);
  app.post('/users/writerDepositPost',users.writerDepositPost);
  app.post('/users/addBrands',users.addBrandsPost);
  app.post('/users/writerContent',users.writerContentPost);
  app.post('/users/Feedback',users.feedbackPost);
  app.post('/users/preferredNetworks', users.preferredNetworks);

  app.post('/users/customMarketing',users.customMarketing);
  app.post('/users/ebookDownload',users.ebookDownload);
  app.post('/users/disconnectLink',users.disconnectLink);
  app.post('/users/changeEmail',users.changeEmail);
  app.get('/users/emailChangeConfirm', users.changeEmailConfirm);
  app.post('/users/invoiceAmountPost',users.invoiceAmountPost);
  app.post('/users/showPostedBlurbs',users.showPostedBlurbs);
  app.post('/users/editImproveProfile',users.editImproveProfile);
  app.post('/users/improveProfile',users.improveProfile);
  app.post('/users/deleteCallToAction',users.deleteCallToAction);
  app.post('/users/editCallAction',users.editCallToAction);

  // testing in analytics page
  app.get('/users/testAnalytics', users.testAnalytics);
  // app.get('/users/testpopulate',users.testpopulate);
  app.get('/users/writeDefaultBlurbs', users.writeDefaultBlurbs);
  app.post('/users/writeDefaultBlurbsPost',users.writeDefaultBlurbsPost);
  app.get('/users/adminAutoClients',users.adminAutoClients);
  app.post('/users/autoClientsPost',users.autoClientsPost);
  app.get('/users/addPromoCode',users.addPromoCode);
  app.post('/users/addDiscountPolicy',users.addDiscountPolicy);
  app.post('/users/ifPostIsAllowed',users.ifPostIsAllowed);

}