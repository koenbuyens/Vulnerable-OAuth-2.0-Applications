# Damn Vulnerable OAuth 2.0 Applications

This project contains a vulnerable OAuth 2.0 server ([gallery](./gallery)), a vulnerable OAuth 2.0 classic web application client ([photoprint](./photoprint)), and an attackers site exploiting it all ([attacker](./attacker)).

To run the applications:
1. Edit your hosts file to include photoprint and gallery ([Windows](https://support.rackspace.com/how-to/modify-your-hosts-file/), [Linux](https://vitux.com/linux-hosts-file/), [Mac OSX](https://www.imore.com/how-edit-your-macs-hosts-file-and-why-you-would-want)). If you want to check some of the attacks, also add attacker.

    ```bash
    127.0.0.1           gallery photoprint attacker localhost
    ```
2. Import the mongodb database

    ```bash
    cd gallery/mongodbdata
    mongorestore -d gallery2 gallery2/
   ```

3. Install the servers:

    ```bash
    cd gallery
    npm install
    cd ..
    cd photoprint
    npm install
    cd ..
    cd attacker
    npm install
    ```
    
4. Start the servers:

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

5. Go to [http://photoprint:3000](http://photoprint:3000) to print photos hosted by gallery. **Hint**: username is koen and password is password. You can also browse the gallery by surfing to [http://gallery:3005](http://gallery:3005).

6. Test out various OAuth2-related attacks by surfing to [http://attacker:1337](http://attacker:1337).
