# Damn Vulnerable OAuth 2.0 Applications

This project contains the code resulting from my experimentation with express-oauth2orize and the oauth2 protocol.

To run the applications:
1. Edit your hosts file to include photoprint and gallery. If you want to check some of the attacks, also add attacker.

    ```bash
    127.0.0.1           gallery photoprint attacker localhost
    ```
2. Import the mongodb database

    ```bash
    cd gallery/mongodbdata
    mongorestore -d gallery2 gallery2/
   ```

3. Start the servers:

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

4. Go to [http://photoprint:3000](http://photoprint:3000) to print photos hosted by gallery. **Hint**: username is koen and password is password. You can also browse the gallery by surfing to [http://gallery:3005](http://gallery:3005).

5. Test out various OAuth2-related attacks by surfing to [http://attacker:1337](http://attacker:1337).
