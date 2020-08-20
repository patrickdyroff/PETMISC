var {Cc, Ci, Cr, Cu} = require("chrome");
var ss = require("sdk/simple-storage");
var utils = require('sdk/window/utils');
var gBrowser = utils.getMostRecentBrowserWindow().getBrowser();
var url = require("sdk/url")


var CertChecker = require("./cert-checker");

var alert_button = {
    alert_function: function(){
	console.log("Options Button Working");
    }
}
    
//Cert Retrieval Meathod
var CertPageObserver =
{
    observe: function(subject, topic, data)
    {
	if (topic == "http-on-examine-response") {
	    var channel = subject.QueryInterface(Ci.nsIHttpChannel);
	    
	    var page = channel.URI.spec;
	    var secInfo = channel.securityInfo;

	    if( secInfo ){  // if there is a cert; otherwise, nothing to do but pass

		var cert = secInfo.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.QueryInterface(Ci.nsISSLStatus).serverCert;
		var host = channel.URI.host;
		
		console.debug("INFO: examining cert of "+ page +" ("+ host + ") on response: :<<<" + cert + ">>>");
		
		//If the cert is not in the list, check if its self signed, if so log the cert
		
		if( GreyList.contains(host)){  // if the cert is in a "blacklist" of self-signed certs, warn!
		    // TODO: GET this warning should go to user, not just the console!(Come back to this)
		    console.debug("ALERT: went to a graylsited site: " + page +" ("+ host + ")");
		    this.greyList_Alert(host);
		}
		else{                                  //..if it's not, check if it needs to be & put it there, otherwise pass 
		    if( CertChecker.is_self_signed(cert) ){
			ss.storage.self_signed_hosts.push(host);   // remember the cert
		    }
		}
	    }

	}  // done with http-on-examine-response
    
	if (topic == "http-on-modify-request") {

	    var channel = subject.QueryInterface(Ci.nsIHttpChannel);
	    var page = channel.URI.spec;
	    var host = channel.URI.host;

	    var page_url = url.URL(page);
	    var search = page_url.search;

	    console.log("INFO: examining request: " + page +" ("+ host + ")" + " search: " + search);

	    if( GreyList.contains(host) && search.length > 1  ){ // if greylisted, warn the user
		console.log("ALERT: going to greylsited page: "+ page +" ("+ host + ")");
		// do actual GUI alert work, take user decision!(Come back to this)
		if(page.contains("=?")==TRUE){
		    this.GetAlert(page);
		}
		
		this.greyList_Alert(page);
		// do what it takes to block the request: channel.cancel(Cr.NS_BINDING_ABORTED);
		channel.cancel(Cr.NS_BINDING_ABORTED);
	    }
	    else{
		// pass
	    }
	}  // done with http-on-modify-request
    },
    
    //This Function alerts the user that they are visiting a greylisted site
    GetAlert: function(page) {
        //If the browser supports nsIAlertsService, it uses a short function that is already supported                                                                                                              
        // TODO: POST add host here, for clarity that it's hosts that get graylisted, not individual URLs.(Come back to this)                                                                                       
        //      try {                                                                                                                                                                                               
	var title = 'Get Request Alert';
	var text = "ALERT: You are going to a page that requests information!";
	//      cc['@mozilla.org/alerts-service;1'].                                                                                                                                                            
	//getService(ci.nsIAlertsService).                                                                                                                                                                      
	//showAlertNotification(null, title, text, false, '', null);                                                                                                                                            
	//}                                                                                                                                                                                                     
        //If it is not supported and returns an error, it uses this function                                                                                                                                        
        //catch (e) {                                                                                                                                                                                               
	var message = 'ALERT: You are going to a page that requests information!'; //Alert needs editing
	var nb = gBrowser.getNotificationBox();
	var n = nb.getNotificationWithValue('getRequestAlert');
	//if(n) {                                                                                                                                                                                               
	//  n.label = message;                                                                                                                                                                                  
	//}                                                                                                                                                                                                     
	//else {                                                                                                                                                                                                
	var buttons = [{
		label: 'Continue',
		callback: function(notif, descr){
		    console.log("Notification box button 1 pressed");
		    //alert_button.alert_function()                                                                                                                                                             
		}
	    },
{
    label: 'Oops! Don\'t continue.',
    callback: function(notif, descr){
	console.log("Notification box button 2 pressed");
	//alert_button.alert_function()                                                                                                                                                             
    }
}
	    ];

	const priority = nb.PRIORITY_CRITICAL_BLOCK;;
	nb.appendNotification(message, 'greylisted_page',
			      'chrome://browser/skin/Info.png',
			      priority, buttons);
    },

    greyList_Alert: function(page) {
	//If the browser supports nsIAlertsService, it uses a short function that is already supported
	// TODO: POST add host here, for clarity that it's hosts that get graylisted, not individual URLs.(Come back to this)
	//	try {
	    var title = 'GreyListed Page';
	    var text = "ALERT: going to a greylisted page"+page+"";
	    //	    cc['@mozilla.org/alerts-service;1'].
	    //getService(ci.nsIAlertsService).
	    //showAlertNotification(null, title, text, false, '', null);
	    //}
	//If it is not supported and returns an error, it uses this function
	//catch (e) {
	    var message = 'ALERT: going to a greylisted page'+page+""; //Alert needs editing
	    var nb = gBrowser.getNotificationBox();
	    var n = nb.getNotificationWithValue('greylisted_page');
	    //if(n) {
	    //	n.label = message;
	    //} 
	    //else {
	    var buttons = [{
		    label: 'I fully trust this site',
		    callback: function(notif, descr){ 
			console.log("Notification box button 1 pressed");
			//alert_button.alert_function() 
		    }
		},
                {
		    label: 'Block sending form data to this site',
		    callback: function(notif, descr){ 
			console.log("Notification box button 2 pressed");
			//alert_button.alert_function() 
		    }
		}
		];
	    
	    const priority = nb.PRIORITY_CRITICAL_BLOCK;;
	    nb.appendNotification(message, 'greylisted_page',
				  'chrome://browser/skin/Info.png',
				  priority, buttons);
    },

    cert_to_string: function(cert){
	return cert.toString();
    },
    
    //Registering and unregistering observers...
    
    get observerService() {
	return Cc["@mozilla.org/observer-service;1"]
	.getService(Ci.nsIObserverService);
    },
    
    register: function()
    {
	this.observerService.addObserver(this, "http-on-modify-request", false);
	this.observerService.addObserver(this, "http-on-examine-response", false);
    },
    unregister: function()
    {
	this.observerService.removeObserver(this, "http-on-modify-request");
	this.observerService.removeObserver(this, "http-on-examine-response");
    }    
};

var GreyList = 
{
    init_if_empty: function() {
	//Creates list of self-signed hosts if not already present in simple storage
	if (!ss.storage.self_signed_hosts){
	    ss.storage.self_signed_hosts = [];
	}	
    },

    // (Come back to this)
    //    Note: this is "linear search", horrible for large collections. Redo this with a dictionary/hash table!
    contains: function( elt ){
	var arr = ss.storage.self_signed_hosts;
	console.debug("Checking if <<"+elt+">> is contained in the graylist");
	for(var i=0; i < arr.length; i++){
	    if(arr[i] === elt){
		return true;
	    }
	}
	return false;
    }
};

GreyList.init_if_empty();
CertPageObserver.register();

// Debug only: dump the self_signed_hosts list
require("sdk/ui/button/action").ActionButton({
	id: "dump-self-signed",
	    label: "Dump self-signed",
	    icon: "./read.png",
	    onClick: function() {
	    if(!ss.storage.self_signed_hosts){
		console.debug("ss.storage.self_signed_hosts is null or broken")
	    }
	    else{
		console.debug(ss.storage.self_signed_hosts);
	    }
	}
    });

