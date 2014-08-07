
/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
  if (!req.isAuthenticated()) {

    return res.redirect('/')
  }
  next()
};

exports.requiresValid = function (req, res, next) {
  if (!req.isAuthenticated()) {

    return res.redirect('/')
  }

 
  if(req.user.userType=='brand'){
     req.user.brand.lastDate = new Date();
     req.user.save(function(err){
        if(err)
          console.log(err);
     })

  }
   

 

  //todo: need to add date
  //if(!req.user.valid && ){
    //return res.redirect('/waitingValidation')
  //}



  next()
};



/*
 *  User authorizations routing middleware
 */

exports.user = {
    hasAuthorization : function (req, res, next) {
      if (req.profile.id != req.user.id) {
        return res.redirect('/users/'+req.profile.id)
      }
      next()
    }
}

