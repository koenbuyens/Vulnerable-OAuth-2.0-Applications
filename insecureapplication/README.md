# Project Setup

This project contains the code resulting from my experimentation with express-oauth2orize and the oauth2 protocol.

To run the applications.

First edit your hosts file to include photoprint and gallery.

```bash
127.0.0.1           gallery photoprint attacker localhost
```

Second, import the mongodb database

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

Then go to [http://photoprint:3000](http://photoprint:3000) to print photos hosted by gallery.
Hint: username is koen and password is password.

You can also browse the gallery by surfing to [http://gallery:3005](http://gallery:3005).

You can test out various OAuth2-related attacks by surfing to [http://attacker:1337](http://attacker:1337).
