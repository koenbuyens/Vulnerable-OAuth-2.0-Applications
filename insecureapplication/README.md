This project contains the code resulting from my experimentation with
express-oauth2orize and the oauth2 protocol.

First import the mongodb database
```bash
cd gallery/mongodbdata
mongorestore -d gallery2 gallery2/
```

Then start the servers:
```bash
cd gallery
npm start &
cd ..
cd photoprint
npm start &
cd ..
cd attacker
npm start &
```

Then go to http://localhost:3000 to print photos hosted by gallery.
Hint: username is koen and password is password

You can also browse the gallery by surfing to http://localhost:3005

You can test out various OAuth2-related attacks by surfing to http://localhost:1337
