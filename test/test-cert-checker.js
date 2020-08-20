var {Cc, Ci, Cr, Cu} = require("chrome");

var CertChecker = require("./cert-checker");

// Set console to verbose
var loglevel_property_name = "extensions.sdk.console.logLevel";
require("sdk/preferences/service").set(loglevel_property_name, "all");


// From https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest; 
//   first recommended method doesn't work. 
const { XMLHttpRequest } = Cc["@mozilla.org/appshell/appShellService;1"]
    .getService(Ci.nsIAppShellService)
    .hiddenDOMWindow;

var dump = function(string){
    console.log( string );
};
    
var get_cert_from_site = function(url){
    var xmlHttp = null;
    
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false );  //note that the request is sync, so that we don't have to define listeners to check the outcome
    xmlHttp.send( null );  

    // check channel on returned request
    var channel = xmlHttp.channel;

    // the rest of the code pasted from 
    // http://stackoverflow.com/questions/6983401/how-can-i-get-the-ssl-certificate-info-for-the-current-page-in-a-firefox-exten

    if (! channel instanceof  Ci.nsIChannel) {
        dump("No channel available");
        return null;
    }

    var secInfo = channel.securityInfo;

    // Print general connection security state
    if (secInfo instanceof Ci.nsITransportSecurityInfo) {
        dump("Name: \t" + channel.name );
        secInfo.QueryInterface(Ci.nsITransportSecurityInfo);

        dump("\tSecurity state: ");

        // Check security state flags
        if ((secInfo.securityState & Ci.nsIWebProgressListener.STATE_IS_SECURE) == Ci.nsIWebProgressListener.STATE_IS_SECURE)
            dump("secure");

        else if ((secInfo.securityState & Ci.nsIWebProgressListener.STATE_IS_INSECURE) == Ci.nsIWebProgressListener.STATE_IS_INSECURE)
            dump("insecure");

        else if ((secInfo.securityState & Ci.nsIWebProgressListener.STATE_IS_BROKEN) == Ci.nsIWebProgressListener.STATE_IS_BROKEN)
            dump("unknown");

        dump("\tSecurity description: " + secInfo.shortSecurityDescription );
        dump("\tSecurity error message: " + secInfo.errorMessage );
    }
    else {
        dump("\tNo security info available for this channel");
	return null;
    }

    // Print SSL certificate details
    if (secInfo instanceof Ci.nsISSLStatusProvider) {

        var cert = secInfo.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.QueryInterface(Ci.nsISSLStatus).serverCert.QueryInterface(Ci.nsIX509Cert );

	if( ! cert || ! cert instanceof Ci.nsIX509Cert ){
	    dump("Empty cert from secInfo or not a Ci.nsIX509Cert , aborting");
	    return null;
	}
	dump("\tCommon name (CN) = " + cert.commonName);
        dump("\tOrganisation = " + cert.organization );
        dump("\tIssuer = " + cert.issuerOrganization );
        dump("\tSHA1 fingerprint = " + cert.sha1Fingerprint );

        var validity = cert.validity.QueryInterface(Ci.nsIX509CertValidity);
        dump("\tValid from " + validity.notBeforeGMT );
        dump("\tValid until " + validity.notAfterGMT );

	return cert;
    }
    else{
        dump("\tFailed to obtain certificate for this channel");
	return null;
    }
};

//Website testing Examples

exports["test google.com"] = function(assert){
    assert.ok( CertChecker.is_self_signed( get_cert_from_site("https://google.com/")) == false, "google assert ok");
};

exports["test gmail.com"] = function(assert){
	assert.ok( CertChecker.is_self_signed( get_cert_from_site("https://gmail.com/") ) == false, "cnn assert ok");
};

exports["test yahoo.com"] = function(assert){
	assert.ok( CertChecker.is_self_signed( get_cert_from_site("https://yahoo.com/") ) == false, "cnn assert ok");
};

exports["test facebook.com"] = function(assert){
	assert.ok( CertChecker.is_self_signed( get_cert_from_site("https://facebook.com/") ) == false, "cnn assert ok");
};

//Self-Signed Example:
//exports["test cnn.com"] = function(assert){
//	assert.ok( CertChecker.is_self_signed( get_cert_from_site("https://kerf.cs.dartmouth.edu/") ) == true, "kerf.cs assert ok");
//};


require("sdk/test").run(exports);