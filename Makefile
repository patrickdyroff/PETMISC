profile = /Users/patrickdyroff/test-addons/testprofile

run: 
	cfx -p $(profile) run

t: 
	cfx test

clean: 
	rm $(profile)/jetpack/*/simple-storage/store.json
