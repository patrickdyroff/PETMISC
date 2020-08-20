//This function checks if certicate is self-signed

exports.is_self_signed = function(cert){

    // check before comparizons is any of these are null/empty strings
    
    if (!cert.issuerOrganization || !cert.commonName){ // Checking if Certicate has security data
	console.debug("DEBUGGING: issuerOrganization: "+cert.issuerOrganization+" commonName: "+cert.commonName + " organization:" +cert.organization );
	console.debug("Cert "+ cert.commonName +" does not have important security information, has been logged");
	return true;
    }
    
    else if(cert.issuerOrganization == cert.commonName) { // testing for Self-Signed Certificates
	console.debug("DEBUGGING: issuerOrganization: "+cert.issuerOrganization+" commonName: "+cert.commonName + " organization:" +cert.organization );
	console.debug("Cert "+ cert.commonName +" is self-signed, has been logged");
	return true;
    }
    
    //Certificate has info and is not self signed
    
    console.log("Check passed");
    return false;

};
 




