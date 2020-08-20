//file that the function retrieves the Cert (in the test folder)
var GetCert = require("./test-cert-checker");
//file that checks the cert (in the ../lib folder)
var certChecker = require("../lib/cert-checker");
//This saves the urls into an array from a file (urls.txt)
var UrlArray = fs.readFileSync('urls.txt').toString().split("\n");

//fuction that checks each url's cert
for(url in array) {
    
    cert = GetCert.get_cert_from_site(i);

    //Checking that the cert was retrieved, if not it continues and notes the url that produced the error
    if (cert == null){
	console.debug(url +":\t could not retrieve cert.\n");
	continue;
    }

    //Checks if the url is self signed. function can be found in the cert-checker.js in the lib folder
    if(certChecker.is_self_signed(cert) == true){
	console.debug(url + ":\t is self-signed.\n");
    }
    else{
	console.debug(url +":\t is not self-signed.\n");
    }
}
