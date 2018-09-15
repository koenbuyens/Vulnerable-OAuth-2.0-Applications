# Single Page Application: Implicit Grant Flow

The implicit grant is a simplified authorization code flow in which the client
is issued an access token directly at the authorization endpoint, rather than
an authorization code. In our running example, it would look as follows.

1. Our user Vivian navigates to the printing website. This website is called the “Client”. Vivian uploaded the pictures to picture gallery site (Gallery). The printing website (client, `photoprint`) offers the possibility to obtain pictures from the gallery site via a button that says “Print pictures from the gallery site”. Vivian clicks that button.
2. The client redirects her to an Authorization Server (AS; Authorization Endpoint). That server allows Vivian to authenticate to the gallery site and ask her if she consents to the Client accessing her pictures.
3. Assuming that Vivian gives her consent, the AS generates an Access Token and sends it back to Vivian’s browser with a redirect command toward the return URL specified by the Client. The Access Token is part of that URL.
4. The browser honors the redirect and passes the Access Token to the Client. The Client can access the PR; Vivian's pictures with the Access Token.