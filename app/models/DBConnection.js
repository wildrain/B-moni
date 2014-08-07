var mongoose=require("mongoose"),
blurbiDB=require("./users"),
blurbiBotDB=require("./usersBot");

exports.CREATE_CONNECTIONS=function(){
	blurbiDB.CREATE_BLURBIDB_CONNECTION();
	blurbiBotDB.CREATE_BLURBIBOTDB_CONNECTION();
}

exports.GET_CONNECTIONS=function(){
	return con={
		blurbiDBConnection: blurbiDB.GET_BLURBIDB_CONNECTION(),
		blurbiBotDBConnection: blurbiBotDB.GET_BLURBIBOTDB_CONNECTION()
	};
}