# First Party Mobile Application: Resource Owner Password Credentials Flow

The resource owner password credentials grant is a simplified flow in which the client uses the
resource owner password credentials (username and password) to obtain an access token. In our
running example, it would look as follows.

TODO pic

1. A user, let's call her Vivian, navigates to the printing website. This website is called the “Client”. Vivian uploaded the pictures to picture gallery site (Gallery). The printing website (client, `photoprint`) offers the possibility to obtain pictures from the gallery site via a button that says “Print pictures from the gallery site”. Vivian clicks that button and provides her credentials.
2. The client submits Vivian's credentials to the Authorization Server.
3. The AS generates an Access Token and sends it back to the Client.
4. The Client can access the Resource Server; Vivian's pictures with the Access Token
