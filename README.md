# OAuth 2.0: Security Considerations

## TL;DR

We show how to use OAuth 2.0 securely when using a [Classic Web Application](#classic-web-application-authorization-code-grant-flow),
a [Single Page Application](#single-page-application-implicit-grant-flow), and a [Mobile Application](#mobile-application-authorization-code-grant-with-pkce) as clients. For each of these clients, we  elaborate on the overall design, implement that design using the MEAN stack, and touch upon common security mistakes. You can exploit these mistakes by deploying the [damn vulnerable OAuth 2.0 applications](https://github.com/koenbuyens/Damn-Vulnerable-OAuth-2.0-Applications/blob/master/insecureapplication/README.md).

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [TL;DR](#tldr)
- [Introduction](#introduction)
- [Running Example and Background](#running-example-and-background)
- [Architect: Major Design Decisions](#architect-major-design-decisions)
  - [Use the Authorization Code Grant for Classic Web Applications and Native Mobile Apps](#use-the-authorization-code-grant-for-classic-web-applications-and-native-mobile-apps)
  - [Use Refresh Tokens When You Trust the Client to Store Them Securely](#use-refresh-tokens-when-you-trust-the-client-to-store-them-securely)
  - [Use Handle-Based Tokens Outside Your Network](#use-handle-based-tokens-outside-your-network)
  - [Selecting the Token Type](#selecting-the-token-type)
  - [Use Bearer Tokens When You do not Care to Whom They Were Issued](#use-bearer-tokens-when-you-do-not-care-to-whom-they-were-issued)
  - [Combining Authorization Server and Resource Server](#combining-authorization-server-and-resource-server)
- [Classic Web Application: Authorization Code Grant Flow](#classic-web-application-authorization-code-grant-flow)
  - [Design of OAuth 2.0 Classic Web Application](#design)
  - [Insecure Implementation](#insecure-implementation)
    - [Gallery](#gallery)
      - [Step 1: Click print Button](#step-1-click-print-button)
      - [Step 2: Redirect to Gallery, Authenticate, and Consent Request](#step-2-redirect-to-gallery-authenticate-and-consent-request)
      - [Step 3: Approval and Generation of Authorization Code](#step-3-approval-and-generation-of-authorization-code)
      - [Step 4: Redirection To The Client](#step-4-redirection-to-the-client)
      - [Step 5:  Client Sends Authorization Code And Its Credentials To The Token Endpoint](#step-5-client-sends-authorization-code-and-its-credentials-to-the-token-endpoint)
      - [Step 6: Issue An Access Token At The Token Endpoint](#step-6-issue-an-access-token-at-the-token-endpoint)
      - [Step 7: Access a Resource](#step-7-access-a-resource)
    - [Print](#print)
  - [Security Considerations](#security-considerations)
    - [Gallery Authorization Server](#gallery-authorization-server)
      - [Authorization Endpoint: Validate the RedirectURI Parameter](#authorization-endpoint-validate-the-redirecturi-parameter)
      - [Authorization Endpoint: Generate Strong Authorization Codes](#authorization-endpoint-generate-strong-authorization-codes)
      - [Authorization Endpoint: Expire Unused Authorization Codes](#authorization-endpoint-expire-unused-authorization-codes)
      - [Token Endpoint: Invalidate Authorization Codes After Use](#token-endpoint-invalidate-authorization-codes-after-use)
      - [Token Endpoint: Bind the Authorization Code to the Client](#token-endpoint-bind-the-authorization-code-to-the-client)
      - [Token Endpoint: Expire Access and Refresh Tokens](#token-endpoint-expire-access-and-refresh-tokens)
      - [Token Endpoint: Generate Strong Handle-Based Access and Refresh Tokens](#token-endpoint-generate-strong-handle-based-access-and-refresh-tokens)
      - [Token Endpoint: Store Handle-Based Access and Refresh Tokens Securely](#token-endpoint-store-handle-based-access-and-refresh-tokens-securely)
      - [Token Endpoint: Limit Token Scope](#token-endpoint-limit-token-scope)
      - [Token Endpoint: Store Client Secrets Securely](#token-endpoint-store-client-secrets-securely)
      - [Token Endpoint: Bind Refresh Token to Client](#token-endpoint-bind-refresh-token-to-client)
      - [Resource Server: Reject Revoked Tokens](#resource-server-reject-revoked-tokens)
      - [Resource Server: Validate Token Scope](#resource-server-validate-token-scope)
      - [Implement Rate-Limiting](#implement-rate-limiting)
    - [Photoprint OAuth 2.0 Client](#photoprint-oauth-20-client)
      - [Store Client Secrets Securely](#store-client-secrets-securely)
      - [Store Access and Refresh Tokens Securely](#store-access-and-refresh-tokens-securely)
- [Mobile Application: Authorization Code Grant with PKCE](#mobile-application-authorization-code-grant-with-pkce)
  - [Design of OAuth 2.0 Mobile Application](#design-of-oauth-20-mobile-application)
  - [Implementation](#implementation)
  - [Testing](#testing)
- [Single Page Application: Implicit Grant Flow](#single-page-application-implicit-grant-flow)
  - [Design of OAuth 2.0 SPA Client](#design-of-oauth-20-spa-client)
  - [Implementation of OAuth 2.0 SPA Client](#implementation-of-oauth-20-spa-client)
  - [Testing of OAuth 2.0 SPA Client](#testing-of-oauth-20-spa-client)
- [First Party Mobile Application: Resource Owner Password Credentials Flow](#first-party-mobile-application-resource-owner-password-credentials-flow)
  - [Design of First Party Mobile Application Client](#design-of-first-party-mobile-application-client)
  - [Implementation of First Party Mobile Application Client](#implementation-of-first-party-mobile-application-client)
  - [Security Considerations of First Party Mobile Application Client](#security-considerations-of-first-party-mobile-application-client)
- [Checklists](#checklists)
  - [For Architects](#for-architects)
  - [For Software Engineers](#for-software-engineers)
  - [For Testers](#for-testers)
- [Conclusion](#conclusion)

<!-- /TOC -->

## Introduction

In this article, we elaborate on *common* security mistakes that architects and developers make when designing or implementing OAuth 2.0-enabled applications. The article not only describes these mistakes from a theoretical perspective, but also provides a set of working sample applications that contain those mistakes. This serves three purposes:

1. developers are able to identify a missing security control and learn how to implement it securely.
1. architects and developers are able to assess the impact of not implementing a security control.
1. Testers are able to identify the mistakes in a running application.

The article is structured as follows. Section [Background](#background) introduces the OAuth 2.0 Protocol using a running example. The subsequent sections show how to use OAuth 2.0 when using a [Classic Web Application](#classic-web-application-authorization-code-grant-flow), a [Single Page Application](#single-page-application-implicit-grant-flow), and [Mobile Application](#mobile-application-authorization-code-grant-with-pkce) as clients. For each of these sections, we  elaborate on the overall design, implement that design using the MEAN stack, and touch upon common security mistakes. Section [Checklists](#checklists) summarizes this article in the form of checklists for architects, developers, and testers. Finally, Section [Conclusion](#conclusion) concludes.

**Note:** the mistakes are common across technology stacks; we use the MEAN stack for illustration purposes only.

## Running Example and Background

Our canonical running example consists of a web site that enables users to manage pictures, named `gallery`.  This gallery application is similar to `flickr.com` in the sense that users can upload pictures, share them with friends, and organize those pictures in different albums.

 As our gallery application became quite popular, we got requests from various companies to integrate with our `gallery` application. To that end, we decided to open up the `REST API` that forms the foundation of our application towards those companies. These companies use the following types of clients:
- a third-party website that allows users to print the pictures hosted at our gallery site, named `photoprint`.
- a third-party mobile application that enables users to view pictures from many gallery applications.
- a website of a printing company that has been designed as a single page application.

Naturally, we also would like to create our own mobile application that our users can use to access our gallery site. However, as we are concerned about security, users should be able to give those third-party applications permission to access their pictures without providing their username and password to those applications. It seems that the OAuth 2.0 protocol might help achieve our goals.

![Our running example consists of a photo gallery API that can be accessed by many applications](./pics/RunningExample.png)

[OAuth 2.0](https://tools.ietf.org/html/rfc6749) is a [standard](https://tools.ietf.org/html/rfc6750) that enables users to give websites access to their data/services at other websites. For instance, a user gives a photo printing website access to her pictures on Flickr. Before performing a deep-dive into the specifics of OAuth 2.0, we introduce some definitions (taken from auth0):

- ***Resource Owner***: the entity that can grant access to a protected resource. Typically this is the end-user.
- ***Client***: an application requesting access to a protected resource on behalf of the Resource Owner. This is also called a Relying Party.
- ***Resource Server***: the server hosting the protected resources. This is the API you want to access, in our case `gallery`.
- ***Authorization Server***: the server that authenticates the Resource Owner, and issues access tokens after getting proper authorization. This is also called an identity provider (IdP).
- ***User Agent***: the agent used by the Resource Owner to interact with the Client, for example a browser or a  mobile application.

In OAuth 2.0, the interactions between the user and her browser, the Authorization Server, and the Resource Server can be performed in four different flows.

1. the ***authorization code grant***: the *Client* redirects the user (*Resource Owner*) to an *Authorization Server* to ask the user whether the *Client* can access her *Resources*. After the user confirms, the *Client* obtains an *Authorization Code* that the *Client* can exchange for an *Access Token*. This *Access Token* enables the *Client* to access the *Resources* of the *Resource Owner*.
1. the ***implicit grant*** is a simplification of the authorization code grant. The Client obtains the *Access Token* directly rather than being issued an *Authorization Code*.
1. the ***resource owner password credentials grant*** enables the *Client* to obtain an *Access Token* by using the username and password of the *Resource Owner*.
1. the ***client credentials grant*** enables the *Client* to obtain an Access Token by using its own credentials.

Do not worry if you do not understand the flows right away. They are elaborated upon in detail in subsequent sections. What you should remember is that:

- *Clients* can obtain *Access Tokens* via four different flows.
- *Clients* use these access tokens to access an API.

Before opening up our gallery API towards third-parties, we would need to make the following high-level design decisions.

## Architect: Major Design Decisions

Now that we know what OAuth 2.0 is typically used for, we elaborate on the major design decisions that architects face when designing an OAuth 2.0 enabled application.

### Use the Authorization Code Grant for Classic Web Applications and Native Mobile Apps

A major design decision is deciding which flows to support. This largely depends on the type of clients the application supports. [Auth0 provides an excellent flow chart that helps making a good  decision](https://auth0.com/docs/api-auth/which-oauth-flow-to-use). In summary, if the *Client* is:

- A classic web application, use the Authorization Code Grant.
- A single page application, use the Implicit Grant.
- A native mobile application, use the Authorization Code Grant with PKCE.
- A client that is absolutely trusted with user credentials (i.e. the Facebook app accessing Facebook), use the Resource Owner Password Grant.
- A client that is the owner of the data, use the Client Credentials Grant.

![A decision tree that helps an architect to decide which OAuth 2.0 flows to support](./pics/DecisionTreeFlow.png)

Using an incorrect flow for a client has various security implications. For instance, using the Resource Owner Password Grant for third-party mobile applications, gives those mobile applications access to the user's credentials. These credentials allow those applications to access all of the user data, as they can just login as the user itself. This is probably something you want to avoid.

In the subsequent sections, we show how to use OAuth 2.0 when using a [Classic Web Application](#classic-web-application-authorization-code-grant-flow), a [Single Page Application](#single-page-application-implicit-grant-flow), and [Mobile Application](#mobile-application-authorization-code-grant-with-pkce) as clients. For each of these sections, we  elaborate on the overall design, implement that design using the MEAN stack, and touch upon common security mistakes.

### Use Refresh Tokens When You Trust the Client to Store Them Securely

OAuth 2.0 uses two types of tokens, namely Access Tokens and Refresh Tokens.

- ***Access Tokens*** are tokens that the *Client* gives to the API to access *Resources*.
- ***Refresh Tokens*** are tokens that the *Client* can use to obtain a new *Access Token* once the old one expires.

Think of Access Tokens [like a session that is created once you authenticate to a website](https://nordicapis.com/api-security-oauth-openid-connect-depth/). As long as that session is valid, we can interact with that website without needing to login again. Once the session times out, we would need to login again with our username and password. Refresh tokens are like that password, as they allow a *Client* to create a new session.

Just like passwords, it is important that the *Client* stores these *Refresh Tokens* securely. If you do not trust that the client will store those tokens securely, do not issue *Refresh Tokens*. An attacker with access to the *Refresh Tokens* can obtain new *Access Tokens* and use those *Access tokens* to access a user's *Resources*. The main downside of not using *Refresh Tokens* is that users would need to re-authenticate every time the *Access Token* expires.

Note that public clients should not be issued refresh tokens.

![A decision tree that helps an architect to decide whether to support refresh tokens](./pics/DecisionTreeRefreshToken.png)

### Use Handle-Based Tokens Outside Your Network

There are two ways to pass the above tokens throughout the system, namely:

- ***Handle-based Tokens*** are typically random strings that can be used to retrieve the data associated with that token. This is similar to passing a variable by reference in a programming language.
- ***Self-contained Tokens*** are tokens that contain all the data associated with that token. This is similar to passing a variable by value in a programming language.

To increase maintainability, [use self-contained tokens within your network, but use handle-based tokens outside of it](https://www.youtube.com/watch?v=BdKmZ7mPNns). The main reason is that *Access Tokens* are meant to be consumed by the API itself, not by the *Client*. If we share self-contained tokens with Clients, they might consume these tokens in ways that we had not intended. Changing the content (or structure) of our self-contained tokens might thus break lots of *Client* applications (in ways we had not foreseen).

If *Client applications* require access to data that is in the self-contained token, [offer an API](http://tools.ietf.org/html/rfc7662) that enables *Client* applications to obtain information related to that *Access Token*. If we want to use self-contained tokens and prevent clients from accessing the contents, encrypt those tokens.

![A decision tree that helps an architect decide whether to support handle-based tokens](./pics/handle-based-tokens.png)

### Selecting the Token Type

The OAuth 2.0 spec does not specify the types of tokens that can be used and as such we, as architects, must select a token type that makes sense for our application. Applications typically use on of the following token types:

- ***[JSON Web Tokens (JWTs)](https://tools.ietf.org/html/rfc7523)*** are self-contained tokens expressed as a [JavaScript Object Notation (JSON)](https://tools.ietf.org/html/rfc7159) structure. JWTs are part of the [JSON Identity Suite](https://www.slideshare.net/2botech/the-jsonbased-identity-protocol-suite). Other things in this suite include [JSON Web Algorithms (JWA)](https://tools.ietf.org/html/rfc7518) for expressing algorithms, [JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517) for representing keys, [JSON Web Encryption (JWE)](https://tools.ietf.org/html/rfc7516) for encryption, and [JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515) for signatures. These RFCs are typically used by OAuth applications as well as by [OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html).
- ***Custom tokens*** are typically handle-based tokens that store non-standardized information associated with the handle in a database.
- ***[WS-Security tokens](https://tools.ietf.org/html/rfc7522)*** and SAML tokens are typically supported for applications that rely extensively on SAML.

Selecting the token type depends on application constraints. For instance, if the application heavily relies on SAML tokens, it might be best to use the SAML profile. Otherwise, JWTs or custom tokens might be used. Usage of JWTs as  OAuth 2.0 Bearer tokens is recommended when the APIs of the application have been implemented by various partners; e.g. an application using a Micro Service Architecture where the different services are offered by different companies. Each of those token types will have different security considerations to use them securely, but those considerations are not a major factor in selecting one.

![A decision tree that helps an architect to select a token type](./pics/selecting-token-type.png)

### Use Bearer Tokens When You do not Care to Whom They Were Issued

OAuth supports different token profiles, namely:

- ***[Bearer tokens](https://tools.ietf.org/html/rfc6750)*** are like concert tickets: the venue does not care to who the ticket was issued; it lets you attend the concert if you have the ticket regardless of who bought it originally. The API (*Resource Server*) does not care who presents the Bearer token, it gives the *Client* access if it is a valid token.
- ***[Holder of Key tokens](https://tools.ietf.org/html/rfc7800)*** are like debit cards: you can only use it if you provide a PIN that unlocks the card. This PIN assures the merchant that the one using the card is the one to whom it was issued. Holder of Key Tokens cannot be used without proof of possession.

For most applications, Bearer tokens are sufficient. The main downside of using them is that if attackers obtains *Access Tokens*, they can use them.

### Combining Authorization Server and Resource Server

The OAuth 2.0 protocol defines the concepts of an *Authorization Server* (where a user gives consent to allow an application to access its resources) and a *Resource Server* (i.e. the API that an application can access). Both servers can be deployed on the same server or they also may be deployed to different servers.

If you are using a micro-service oriented architecture, it is best practice to separate both server types into different entities, otherwise they can be merged into one.

![A decision tree that helps an architect to decide whether to combine authorization and resource server](./pics/combining-authorization-resource-server.png)

## Classic Web Application: Authorization Code Grant Flow

In this Section, we elaborate on using OAuth 2.0 with a classic web application as Client: we introduce the overall design, implement that design, and touch upon common security mistakes made during design and implementation.

In our running example, the third-party website `photoprint` enables users to print the pictures hosted at our gallery site. The `photoprint` application uses the *Authorization Code Grant*. In the real world, we typically do not control how the `photoprint` application uses our API, and therefore we stipulate the (security) requirements that our partner `photoprint` must implement in a Business Requirements Document (BRD). Additionally, we may verify that the `photoprint` application implements those requirements correctly by performing a security code review or a penetration test.

### Architect: Design

We made the following OAuth 2.0-related design decisions for the `gallery` application:

- the application supports the Authorization Code Grant as its major client,  `photoprint`, is a classic web application.
- we allow the usage of refresh tokens as we want to avoid that users need to authenticate every time the access tokens expire.
- we use custom handle-based tokens that are added as a Bearer header as `gallery` is a monolythic application.
- we combine the Authorization Server and Resource Server into one as `gallery` is a simple application.

We not only made OAuth 2.0-related design decisions, but also related to the technology stack:

- the `gallery` application has a simple REST API: POST (create), GET (read), UPDATE (modify), and DELETE for `images`,`users`, and `albums`. A gallery is the albums and pictures belonging to a user. Users can login via the `login` endpoint. Besides gallery-related functionality, the API also supports the OAuth 2.0-related endpoints: the token endpoint (`token`) and the authorization endpoint (`authorize`).
- the `gallery` application uses the [MEAN stack](http://mean.io/). The application uses [`express.js`](https://expressjs.com/) on top of  [`node.js`](https://nodejs.org/en/) and stores data in [`MongoDB`](https://www.mongodb.com/).

![Authorization Code Grant](./pics/AuthorizationCodeGrant.png)

The interactions between `gallery` and `photoprint` are as follows (major use case).

1. A user, let's call her Vivian, navigates to the printing website. This website is called the `Client`. Vivian uploaded the pictures to picture gallery site (Gallery). The printing website (client, `photoprint`) offers the possibility to obtain pictures from the gallery site via a button that says *“Print pictures from the gallery site”*. Vivian clicks that button.
    ![The Print Button on photoprint.](./pics/printpicturesfromgallery.png)
2. The client redirects her to an Authorization Server (AS; Authorization Endpoint).

    ```http
    GET /oauth/authorize?redirect_uri=http%3A%2F%2Fphotoprint%3A3000%2Fcallback
      &scope=view_gallery&response_type=code&client_id=photoprint HTTP/1.1
    Host: gallery:3005
    Connection: keep-alive
    Referer: http://photoprint:3000/
    ```

    As you notice, the URI contains the parameters `redirect_uri`, `scope`, `response_type`, and `client_id`. The `redirect_uri` is where `gallery` will redirect Vivian after having created an authorization code. The `scope` is the access level that the client needs (`view_gallery` is a custom scope that enables clients to view the pictures from a user's gallery). The `response_type` is `code` as we want an authorization code. The `client_id` is an identifier that represents the `photoprint` application.
3. That server allows Vivian to authenticate to the gallery site and asks her if she consents to the Client accessing her pictures.
    ![Vivian can authenticate to the gallery site.](./pics/authcodegrant-dialog.png)
4. Assuming that Vivian gives her consent, the AS generates an Authorization Code (Authorization Grant) and sends it back to Vivian’s browser with a redirect command toward the return URL specified by the Client.

    ```http
    HTTP/1.1 302 Found
    X-Powered-By: Express
    Location: http://photoprint:3000/callback?
      code=630111c5-3c53-452f-ac8b-ad4e166aff76
    Vary: Accept
    Content-Type: text/html; charset=utf-8
    Content-Length: 128
    Date: Sat, 08 Sep 2018 23:58:43 GMT
    Connection: close

    <p>Found. Redirecting to <a href="http://photoprint:3000/callback
      ?code=630111c5-3c53-452f-ac8b-ad4e166aff76">
        http://photoprint:3000/callback?code=630111c5-3c53-452f-ac8b-ad4e166aff76
      </a>
    </p>
    ```

    The Authorization Code is part of that URL.
5. The browser honors the redirect and passes the Authorization Code to the Client.

    ```http
    GET /callback?code=630111c5-3c53-452f-ac8b-ad4e166aff76 HTTP/1.1
    Host: photoprint:3000
    Connection: keep-alive
    Referer: http://gallery:3005/oauth/authorize?redirect_uri=
      http%3A%2F%2Fphotoprint%3A3000%2Fcallback&scope=view_gallery
      &response_type=code&client_id=photoprint
    ```

    The Authorization Code is part of that URL.
6. The Client forwards that Authorization Code together with its own credentials to the AS (Token Endpoint). From this step on, the interactions are server-to-server. The Authorization Code proves that Vivian consented to the actions that the Client wants to do. Moreover, the message contains the Client’s own credentials (the Client ID and the Client Secret).

    ```http
    POST /oauth/token HTTP/1.1
    Accept: application/json
    host: gallery:3005
    content-type: application/x-www-form-urlencoded
    content-length: 147
    Connection: close

    code=630111c5-3c53-452f-ac8b-ad4e166aff76&redirect_uri=
      http%3A%2F%2Fphotoprint%3A3000%2Fcallback&grant_type=authorization_code
      &client_id=photoprint&client_secret=secret
    ```

    The request contains the parameters `authorization_code`, `redirect_uri`, `grant_type`, `client_id`, and `client_secret`. The `authorization_code` is a proof that the user approved this client to access their resources. The `grant_type` is the type of the code that was delivered (i.e., an `authorization_code`). The `redirect_uri` is the URI where the *Access Tokens* will be delivered. The `client_id` and the `client_secret` authenticate the client. They can be delivered via an Authorization header or as parameters in the body of the request.
7. Assuming that the Client is allowed to make requests, the AS issues to the Client an Access Token. The AS may also issue a Refresh Token. The refresh token enables the Client to obtain new access tokens; e.g. when the old ones expire.

    ```json
    X-Powered-By: Express
    Content-Type: application/json
    Cache-Control: no-store
    Pragma: no-cache
    Connection: close
    Content-Length: 64

    {
      "access_token":"ylSkZIjbdWybfs4fUQe9BqP0LH5Z",
      "expires_in":1800,
      "token_type":"Bearer"
    }
    ```

    The server responds with an access token that the `photoprint` application can use to make calls to the API of the gallery site (which offer access to Vivian’s pictures). Vivian is the Resource Owner, her pictures are Protected Resources (PRs), while the gallery site is the Resource Server (RS).
8. The Client can finally access the PR; Vivian's pictures. The print application then uses the access token to access a resource on gallery.

    ```http
    GET /photos/me HTTP/1.1
    Authorization: Bearer ylSkZIjbdWybfs4fUQe9BqP0LH5Z
    Accept: application/json
    Content-Length: 0
    Host: gallery:3005
    Connection: close
    ```

    The above request returns all pictures of the user belonging to the access token.
9. The gallery application then validates the access token and processes the request.

    ```json
    HTTP/1.1 200 OK
    X-Powered-By: Express
    Vary: Accept
    Content-Type: application/json; charset=utf-8
    Content-Length: 629
    ETag: W/"275-dcpLCFhRa+QsU0X6/pTmz4r/6PQ"
    Date: Mon, 10 Sep 2018 04:02:36 GMT
    Connection: close

    {
      "images": [
        {
          "_id": "581518ab6247a2db75daad6c",
          "created_at": "2016-10-29T21:46:20.130Z",
          "updated_at": "2016-10-29T21:46:20.130Z",
          "url": "7ac9eb7f-1de1-4c47-819f-f41591035479.jpg",
          "description": "Kuleuven Bib",
          "userid": "581518198ede96db3b362157",
          "__v": 0
        },
        {
          "_id": "581521db86758fdcb3f8a39b",
          "created_at": "2016-10-29T22:25:31.761Z",
          "updated_at": "2016-10-29T22:25:31.761Z",
          "url": "ab1dcbf9-69cd-4fb9-b9e6-ea3a01f992a0.jpg",
          "description": "Arenberg Castle",
          "userid": "581518198ede96db3b362157",
          "__v": 0
        }
      ]
    }
    ```

The overall flow looks thus as follows.
![Authorization code flow](./pics/generalflow.gif)

### Developer: Insecure Implementation

#### Gallery

 Feel free to skip to the [Security Considerations Section](#security-considerations) if you are not interested in implementation details. Read the [introductions](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction) on the [Mozilla website](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website) to [understand](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/skeleton_website) how to create a basic node.js application.

Our gallery application is structured like a typical MEAN stack application:

- it implements the ***[Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)*** pattern. The model is the central component that manages the data, logic, and rules of the application. The view is the component that generates the output to the user based on changes in the model; i.e. it consists of the pages/responses that we are going to send to the Client. The controller forms the glue between models and views: it queries the models for data and puts that data into views that is sent to clients (users). The model and controller are custom code, while for the views we use the default [`Pug` (`Jade`)](https://github.com/pugjs/pug) as view template engine.
- Besides the MVC pattern, express.js applications also use a ***[router](https://expressjs.com/en/guide/routing.html)*** that maps URIs to controller functions. Architecturally speaking, this may be part of the controller, but most express.js applications use a separate folder for that.  

The flow throughout our express.js gallery application is as follows. A *Client* makes an HTTP request to our gallery application. The express.js enabled gallery application first passes the request throughout various middleware functionality (plugins that extend the functionality of an express.js application) and then passes it to a route handler. The route handler parses the URI and gives the URI parameters to the implementation(s) associated with that route,  typically a call (in our controller) to our model, a call to a middleware function, or a list of calls to middleware functions or custom code. Once a response is ready, the result is given to the view engine. This engine renders the response that is given to the *Client*.

![Our Gallery Application is an Express.js app](./pics/ExpressMVC.png)

The source code of our Gallery application is structured like a regular express.js application. We created a  general ```app.js``` script that combines the main server. The routes that map URIs to its actual implementation are defined in the ```routes``` folder, the controllers are defined in the controllers folder, the models are defined in the models folder, and the views are defined in the views folder. The `package.json` file defines the application dependencies and other information, while the public folder defines any stylesheets, images, and third-party JavaScript libraries. The structure is thus as follows.

```bash
/gallery
    app.js
    package.json
    /controllers
    /models
    /node_modules
    /public
        /images
        /javascripts
        /stylesheets
            base.css
    /routes
        index.js
        users.js
    /views
        error.pug
        index.pug
        layout.pug
```

The main API of our gallery application is fairly simple. We offer an API for manipulating user profiles and one for manipulating a user's gallery. The API to manipulate a user profile consists of a GET, PUT, and DELETE against a URI with the unique username. These operations respectively get the user profile, modify the profile, or delete the profile. A POST against the main user route creates a new user.

```javascript
router.get('/users/:name', ... );
router.put('/users/:name', ...);
router.delete('/users/:name', ...);
router.post('/users', ...)
```

The API to manipulate a user's gallery consists of a GET and POST against the main gallery URI as well as a GET, POST, DELETE, and PUT against the URI of a specific picture. The GET and POST against the main gallery URI lists the meta-data of the uploaded pictures or creates a new picture respectively. The GET, PUT, and DELETE requests against a specific picture obtain that picture, update the meta-data of that picture, or delete that picture respectively.

```javascript
router.post('/photos', ...);
router.get('/photos',  ...);
router.get('/photos/:username', ...);
router.get('/photos/:username/:imageid/view', ...);
router.get('/photos/:username/:imageid', ...);
router.get('/photos/:username/:imageid/raw',...);
router.put('/photos/:username/:imageid', ...);
router.delete('/photos/:username/:imageid', ...);
```

We use oauth2orize to offer the above API towards OAuth 2.0 clients. To use oauth2orize, we include the library in the code (with `require`) and instantiate it with `createServer`. We register callback functions in this server. Our callback functions contain code to

- generate an authorization code. Our function `grantcode` is registered as a callback to `oauth2orize.grant.code`.
- exchange an authorization code for an access token. Our function `exchangecode` is registered as a callback to `oauth2orize.exhange.authorizationCode`.
- (de-)serialize clients. Our functions `serialize` and `deserialize` are registered to transform a client object into a `client_id` and obtain a client object given the `client_id`.

```javascript
//import the oauth2orize package
var oauth2orize = require('oauth2orize');
// create OAuth 2.0 server
var server = oauth2orize.createServer();
// Register serialialization and deserialization functions.
server.serializeClient(serialize);
server.deserializeClient(deserialize);
// Register supported grant types.
server.grant(oauth2orize.grant.code(grantcode)
);
// Exchange authorization codes for access tokens.
server.exchange(oauth2orize.exchange.authorizationCode(exchangecode));

// function to generate an authorization code
function grantcode() {...}
//function to exchange an authorization code for an access token
function exchangecode() {...}
//function to serialize a client
function serialize() {...}
//function to deserialize a client
function deserialize() {...}
```

### Architect, Developer, and Pentester: Security Considerations

In this section, we present common security mistakes made when designing/implementing an OAuth 2.0 enabled application. This section lists a subset of what is listed in [RFC 6819](https://tools.ietf.org/html/rfc6819).

#### Gallery Authorization Server

##### Authorization Endpoint: Validate the RedirectURI Parameter

If the authorization server does not validate that the redirect URI belongs to the client, it is susceptible to two types of attacks:

- Open Redirect. ![Attacker redirects the victim the victim to a random site.](./pics/openredirect.gif)
- Stealing of Authorization Codes. ![Attacker steals a valid authorization code from the victim.](./pics/openredirect_stealauthzcode.gif)

To remediate this, validate whether the redirect_uri parameter is one the client provided during the registration process.

To validate this as a tester, do the following:

1. Capture the URL that the OAuth 2.0 client uses to talk with the authorization endpoint.  `http://gallery:3005/oauth/authorize?response_type=code&redirect_uri=http%3A%2F%2Fphotoprint%3A3000%2Fcallback&scope=view_gallery&client_id=photoprint`
2. Change the value of the redirect_uri parameter to one you control.  `http://gallery:3005/oauth/authorize?response_type=code&redirect_uri=http%3A%2F%2Fattacker%3A1337%2Fcallback&scope=view_gallery&client_id=photoprint`

##### Authorization Endpoint: Generate Strong Authorization Codes

If the authorization codes are weak, an attacker may be able to guess them at the token endpoint. This is especially true if the client secret is compromised, not used, or not validated. ![Attacker correctly guesses the authorization codes by performing a bruteforce attack.](./pics/weakauthorizationcodes.gif)

To remediate this, generate authorization codes with a length of at least 128 bit using a secure pseudo-random number generator that is seeded properly. Most mature OAuth 2.0 frameworks implement this correctly.

To validate this as a tester, analyze the entropy of multiple captured authorization codes.

1. Configure BurpSuite and intercept the request that the OAuth 2.0 client sends to the OAuth 2.0 Authorization Endpoint.

2. Send that request to BurpSuite Sequencer.  ![Send requests to sequencer.](./pics/weakauthorizationcodes_burpsequencer1.png)

3. Select the request in sequencer and define a custom token location. Select the location of the token.  ![Select token location in sequencer.](./pics/weakauthorizationcodes_burpsequencer2.png)

4. Select 'live capture' and subsequently click 'Analyze now'. The result tells whether the tokens have sufficient entropy. ![Select token location in sequencer.](./pics/weakauthorizationcodes_burpsequencer3.png)

Alternatively, bruteforce the tokens if you have a compromised client secret or if the client secret is not necessary. This is the approach the attacker took.

##### Authorization Endpoint: Expire Unused Authorization Codes

Expiring unused authorization codes limits the window in which an attacker can use captured or guessed authorization codes.

To remediate this, expire authorization codes 15-30 minutes after they have been generated.

To validate this as a tester, obtain an authorization code but only redeem it after 31 minutes.

1. Configure BurpSuite and intercept the request that the OAuth 2.0 client sends to the OAuth 2.0 Authorization Endpoint.
2. Send that request to the BurpSuite Plugin 'Session Timeout Test'.  ![Send the request to session timeout test.](./pics/expiredauthorizationcodes_burptimeout1.png)
3. Configure the plugin by selecting a matching string that indicates the authorization code is invalid (typically 'Unauthorized') and a mininmum timeout of 31 minutes.  ![Send the request to session timeout test.](./pics/expiredauthorizationcodes_burptimeout2.png)
4. Observe the result.

##### Token Endpoint: Invalidate Authorization Codes After Use

Invalidating used authorization codes limits the window in which an attacker can use captured or guessed authorization codes.

To remediate this, follow the OAuth 2.0 specification and delete authorization codes from the database after they have been used.

To validate this as a tester, obtain an authorization code and redeem it twice.

1. Configure BurpSuite and intercept the request that the OAuth 2.0 client sends to the OAuth 2.0 Authorization Endpoint.
2. Send that request to BurpSuite Repeater.
3. Repeat that request and validate whether it fails.

##### Token Endpoint: Bind the Authorization Code to the Client

An attacker can exchange captured or guessed authorization codes for access tokens by using the credentials for another, potentially malicious, client.

![Attacker can exchange the authorization code for an access token as it is not bound to the photoprint client.](./pics/authorizationcodenotboundtoclient.gif)

To remediate this, bind the authorization code to the client.

To validate this as a tester, obtain an authorization code for the OAuth 2.0 client and exchange with another client.

```http
POST /oauth/token HTTP/1.1
host: gallery:3005
Content-Length: 133
Connection: close

code=9&redirect_uri=http%3A%2F%2Fphotoprint%3A3000%2Fcallback&grant_type=authorization_code&client_id=maliciousclient&client_secret=secret
```

##### Token Endpoint: Generate Strong Handle-Based Access and Refresh Tokens

If the tokens are weak, an attacker may be able to guess them at the resource server or the token endpoint. ![Attacker correctly guesses the access tokens by performing a bruteforce attack.](./pics/weakaccesstokens.png)

To remediate this, generate tokens with a length of at least 128 bit using a secure pseudo-random number generator that is seeded properly. Most mature OAuth 2.0 frameworks implement this correctly.

To validate this as a tester, analyze the entropy of multiple captured tokens. Note that it is hard to capture tokens for clients that are classic web applications as these tokens are communicated via a back-channel.

1. Identitify the location of the token endpoint. Most OAuth servers with openID/Connect support publish the locations of their endpoints at `https://[base-server-url]/.well-known/openid-configuration` or at `https://[base-server-url]/.well-known/oauth-authorization-server`. If such endpoint is not available, the token endpoint is usually hosted at token. ![Well known endpoints publish the token endpoint.](./pics/wellknown1.png).
2. Make requests to the token endpoint with valid authorization codes or refresh tokens and capture the resulting access tokens. Note that the client ID and secret are typically required. They may be in the body or as a Basic Authorization header.

    ```http
    POST /token HTTP/1.1
    host: gallery:3005
    Content-Length: 133
    Connection: close

    code=9&redirect_uri=http%3A%2F%2Fphotoprint%3A3000%2Fcallback&
    grant_type=authorization_code&client_id=maliciousclient&client_secret=secret
    ```

3. Analyze the entropy of these tokens using the same approach as described in weak authorization codes.

Alternatively, bruteforce the tokens at the resource server if you have a compromised client secret or if the client secret is not necessary. The attacker above followed this approach.

##### Token Endpoint: Store Handle-Based Access and Refresh Tokens Securely

If the handle-based tokens are stored as plain text, an attacker may be able to obtain them from the database at the resource server or the token endpoint.

To remediate this, hash the tokens before storing them using a strong hashing algorithm. When validating the token, hash the incoming token and validate whether that hashed value exists in the database.

To validate this as a tester, perform a NoSQL injection and validate whether the tokens have been stored unhashed. It is better to validate this using a code review.

##### Token Endpoint: Expire Access and Refresh Tokens

Expiring access and refresh tokens limits the window in which an attacker can use captured or guessed tokens.

To remediate this, expire access tokens 15-30 minutes after they have been generated. Refresh tokens can be valid for much longer. The actual amount depends on the risk profile of the application.

To validate this as a tester, obtain an access token but only redeem it after 31 minutes.

##### Token Endpoint: Store Client Secrets Securely

If the client secrets are stored as plain text, an attacker may be able to obtain them from the database at the resource server or the token endpoint.

To remediate this, store the client secrets like you would store user passwords: hashed with a strong hashing algorithm such as bcrypt, scrypt, or pbkdf2. When validating the secret, hash the incoming secret and compare it against the one stored in the database for that client.

To validate this as a tester, perform a NoSQL injection and validate whether the secrets have been stored unhashed. It is better to validate this using a code review.

##### Use Strong Client Secrets

If the client secrets are weak, an attacker may be able to guess them at the resource server or the token endpoint.

To remediate this, generate secrets with a length of at least 128 bit using a secure pseudo-random number generator that is seeded properly. Most mature OAuth 2.0 frameworks implement this correctly.

To validate this as a tester, analyze the entropy of multiple captured secrets. Note that it is hard to capture secrets for clients that are classic web applications as these secrets are communicated via a back-channel.

##### Implement Rate-Limiting

To prevent bruteforcing, OAuth 2.0 endpoints should implement rate limiting as it slows down an attacker.

To validate this as a tester, try any of the previously listed bruteforcing attacks.

##### Token Endpoint: Bind Refresh Token to Client

TODO

##### Resource Server: Reject Revoked Tokens

TODO

##### Token Endpoint: Limit Token Scope

TODO

##### Resource Server: Validate Token Scope

TODO

#### Photoprint OAuth 2.0 Client

##### CSRF

TODO

##### Store Client Secrets Securely

If the client secrets are stored insecurely, an attacker may be able to obtain them.

To remediate this, store the secrets using secure storage offered by the technology stack (typically encrypted). Keep these secrets out of version repositories.

Validate this during a code review.

##### Store Access and Refresh Tokens Securely

If the handle-based tokens are stored as plain text in a database, an attacker may be able to obtain them from the database at the client.

To remediate this, keep the access tokens in memory and store the refresh tokens using secure storage offered by the technology stack (typically encrypted).

Validate this during a code review.

## Mobile Application: Authorization Code Grant with PKCE

The proof key for code exchange TODO [https://tools.ietf.org/html/rfc7636](https://tools.ietf.org/html/rfc7636)

### Architect: Design of an OAuth 2.0 Mobile Application

TODO design content

### Developer: Insecure Implementation of an OAuth 2.0 Mobile Application

RFC 6819 elaborates on common security mistakes within OAuth 2.0.

### Architect, Developer, Penetration Tester: Security Considerations of an Mobile Application Client

TODO

### Single Page Application: Implicit Grant Flow

#### Architect: Design of OAuth 2.0 SPA Client

TODO pic.

The implicit grant is a simplified authorization code flow in which the client
is issued an access token directly at the authorization endpoint, rather than
an authorization code. In our running example, it would look as follows.

1. Our user Vivian navigates to the printing website. This website is called the “Client”. Vivian uploaded the pictures to picture gallery site (Gallery). The printing website (client, `photoprint`) offers the possibility to obtain pictures from the gallery site via a button that says “Print pictures from the gallery site”. Vivian clicks that button.
2. The client redirects her to an Authorization Server (AS; Authorization Endpoint). That server allows Vivian to authenticate to the gallery site and ask her if she consents to the Client accessing her pictures.
3. Assuming that Vivian gives her consent, the AS generates an Access Token and sends it back to Vivian’s browser with a redirect command toward the return URL specified by the Client. The Access Token is part of that URL.
4. The browser honors the redirect and passes the Access Token to the Client. The Client can access the PR; Vivian's pictures with the Access Token.

### Developer: Implementation of OAuth 2.0 SPA Client

RFC 6819 elaborates on common security mistakes within OAuth 2.0.

### Architect, Developer, Penetration Tester: Security Considerations of a SPA Client

TODO testing

## First Party Mobile Application: Resource Owner Password Credentials Flow

### Architect: Design of First Party Mobile Application Client

The resource owner password credentials grant is a simplified flow in which the client uses the
resource owner password credentials (username and password) to obtain an access token. In our
running example, it would look as follows.

TODO pic

1. A user, let's call her Vivian, navigates to the printing website. This website is called the “Client”. Vivian uploaded the pictures to picture gallery site (Gallery). The printing website (client, `photoprint`) offers the possibility to obtain pictures from the gallery site via a button that says “Print pictures from the gallery site”. Vivian clicks that button and provides her credentials.
1. The client submits Vivian's credentials to the Authorization Server.
1. The AS generates an Access Token and sends it back to the Client.
1. The Client can access the Resource Server; Vivian's pictures with the Access Token

### Developer: Implementation of First Party Mobile Application Client

RFC 6819 elaborates on common security mistakes within OAuth 2.0.

### Architect, Developer, Penetration Tester: Security Considerations of a First Party Mobile Application Client

TODO security considerations

## OpenID Connect

Moreover, OAuth is the foundation for the single sign-on protocol OpenID Connect. OpenID
Connect builds upon OAuth and provides clearly defined interfaces for user
authentication and additional (optional) features, such as dynamic identity
provider discovery and relying party registration, signing and encryption of
messages, and logout.

## Checklists

### For Architects

The following questions obtain the context that is required to analyze the application for bad OAuth related design decisions.

- What is the client using the API?
  - [ ] Classic Web Application
  - [ ] Native Mobile Application
  - [ ] Mobile Application with Web View
  - [ ] Single Page Application
  - [ ] Thick client
  - [ ] Embedded Application
  - [ ] Other
- What token types does the application use?
  - [ ] Self-contained (e.g. JWTs)
  - [ ] Custom (handle-based e.g. unique ID)
  - [ ] WS-security
- What token profiles does the application use?
  - [ ] Bearer tokens
  - [ ] Holder of Key Tokens
- Who developed the client?
  - [ ] We (first-party)
  - [ ] Someone else (third party)

The checklist itself is as follows. Checked boxes are OK.

Use the following tree to determine whether the correct flow was chosen.
![A decision tree that helps an architect to decide which OAuth 2.0 flows to support](./pics/DecisionTreeFlow.png)

- [ ] How does the Client application authenticate users?
  - [x] OpenID Connect
  - [x] SAML Token as part of OAuth flow (SAML Extensions)
  - [ ] It assumes that the user is authenticated because it receives an OAuth token
- How does the client store OAuth client secrets and OAuth refresh tokens?
  - [ ] Hardcoded
  - [ ] Configuration file
  - [x] Using platform provided secure storage such as keychain or keystore on mobile or encrypted configuration files on .NET
- How does the client store access tokens?
  - [x] It does not store them
  - [ ] Hardcoded
  - [ ] Configuration file
  - [ ] Using platform provided secure storage such as keychain or keystore on mobile or encrypted configuration files on .NET
- How does the server store OAuth client secrets?
  - [ ] Hardcoded
  - [ ] Configuration file
  - [ ] Plain-text in Database
  - [x] Hashed in database (like user passwords)
  - [ ] Other
- If the server uses handle-based tokens, how does it store them?
  - [ ] Plain-text in a database
  - [x] Hashed
  - [x] Hashed and salted (this is not necessary, tokens are usually sufficiently long)
- If the server uses JWTs, what type of signatures does it use?
  - [ ] None
  - [x] RSA
  - [ ] Shared secret
- Does the server implement rate limiting against the endpoint to obtain tokens?
  - [x] Yes
  - [ ] No
- When do access tokens expire?
  - [ ] Never
  - [x] Within less than 30 minutes
  - [ ] Within a day
  - [ ] Longer than a day
- When do refresh tokens expire?
  - [ ] Never
  - [x] Within 30 days
  - [x] If mobile application with low risk profile, within 1 year
  - [ ] Other

### For Software Engineers

TODO

### For Testers

- Identify the locations of the different endpoints. Most OAuth servers with openID/Connect support publish the locations of their endpoints at https://[base-server-url]/.well-known/openid-configuration or at https://[base-server-url]/.well-known/oauth-authorization-server.
- Authorization Endpoint
  - [ ] Open redirect at the `redirect_uri` parameter of the Authorization Endpoint.
  - [ ] Check entropy of authorization codes at the Authorization Endpoint. Alternatively, try bruteforcing them.
  - [ ] Validate whether you can request more scope than permissable for your client.
- Token Endpoint
  - [ ] Validate whether authorization codes are expired within 30 minutes if unused.
  - [ ] Validate whether authorization codes can only be used once.
  - [ ] Validate whether authorization codes can be exchanged for access tokens by a different client.
  - [ ] Check whether client secrets are passed in request body or Authorization header.
  - [ ] Check entropy of client secret.
  - [ ] Validate whether Client ID and secret are validated.
  - [ ] Check whether refresh tokens expire within 1 year (depends on appetite for business risk; anything between a day and 1 year is acceptable).
  - [ ] Check whether a different client can exchange the refresh token than the one that obtained it.
  - [ ] Check whether rate limiting has been implemented (to avoid bruteforce of credentials, authorization codes, or refresh tokens).
  - [ ] Check whether the client is not locked out on bruteforce attacks against the client secret.
  - [ ] Check entropy of generated handle-based access and refresh tokens.
  - [ ] Check whether access and refresh tokens are in the response body.
  - [ ] Check whether the response has appropriate caching headers. 
  - [ ] Check whether 
- Resource Server
  - [ ] Check whether access tokens expire within 1 hour.
  - [ ] Check whether access and refresh tokens are in a request header or a request body.
  - [ ] Check whether invalid tokens are rejected.
    - [ ] expired
    - [ ] revoked 
    - JWTs
      - [ ] generated for different resource server
      - [ ] signed by a different issuer (e.g. yourself).
      - [ ] revoked signing key/certificate
      - [ ] signed with the none algorithm
      - [ ] signed using symmetric algorithm and the public key as secret key 
  - [ ] Check whether you can access an API that requires scope that you do not have.

## Conclusion

In this article, we showed how to use OAuth 2.0 securely when using

- a [Classic Web Application](#classic-web-application-authorization-code-grant-flow),
- a [Single Page Application](#single-page-application-implicit-grant-flow), and
- a [Mobile Application](#mobile-application-authorization-code-grant-with-pkce) as clients. For each of these clients, we  elaborated on the overall design, implemented that design using the MEAN stack, and touched upon common security mistakes.

## References

Partially taken from [https://oauth.net/2/](https://oauth.net/2/).

### OAuth 2.0 Core

- [OAuth 2.0 Framework - RFC 6749](http://tools.ietf.org/html/rfc6749)
- [OAuth 2.0 Grant Types](https://oauth.net/2/grant-types/)
  - [Authorization Code](https://tools.ietf.org/html/rfc6749#section-1.3.1)
  - [Implicit](https://tools.ietf.org/html/rfc6749#section-1.3.2)
  - [Password](https://tools.ietf.org/html/rfc6749#section-1.3.3)
  - [Client Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.4)
  - [Device Code](https://tools.ietf.org/html/draft-ietf-oauth-device-flow-07#section-3.4)
  - [Refresh Token](https://tools.ietf.org/html/rfc6749#section-1.5)
- [OAuth 2.0 Bearer Tokens - RFC 6750](https://tools.ietf.org/html/rfc6750)
- [Threat Model and Security Considerations - RFC 6819](https://tools.ietf.org/html/rfc6819)

### Mobile and Other Devices

- [Native Apps - Recommendations for using OAuth 2.0 with native apps - RFC 8252](http://tools.ietf.org/html/rfc8252)
- [PKCE - Proof Key for Code Exchange, better security for native apps - RFC 7636](http://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Device Flow - RFC draft](https://tools.ietf.org/html/draft-ietf-oauth-device-flow)

### Token and Token Management

- [OAuth 2.0 Token Introspection - RFC 7662, to determine the active state and meta-information of a token](http://tools.ietf.org/html/rfc7662)
- [OAuth 2.0 Token Revocation - RFC 7009, to signal that a previously obtained token is no longer needed](http://tools.ietf.org/html/rfc7009)
- [JSON Web Token - RFC 7519](http://tools.ietf.org/html/rfc7519)

### Other Extensions

- [OAuth Assertions Framework - RFC 7521](http://tools.ietf.org/html/rfc7521)
- [SAML2 Bearer Assertion - RFC 7522, for integrating with existing identity systems](http://tools.ietf.org/html/rfc7522)
- [JWT Bearer Assertion - RFC 7523, for integrating with existing identity systems](http://tools.ietf.org/html/rfc7523)
- [OAuth WG Status Pages](https://tools.ietf.org/wg/oauth/)

### Community Resources

- [oauth.net](https://oauth.net/2/)
- [OAuth 2.0 Simplified](https://aaronparecki.com/oauth-2-simplified/)
- Books about OAuth
  - [OAuth 2.0 Simplified by Aaron Parecki](https://oauth2simplified.com/)
  - [OAuth 2 in Action by Justin Richer and Antonio Sanso](https://www.amazon.com/OAuth-2-Action-Justin-Richer/dp/161729327X/?tag=oauthnet-20)
  - [Mastering OAuth 2.0 by Charles Bihis](https://www.amazon.com/Mastering-OAuth-2-0-Charles-Bihis/dp/1784395404?tag=oauthnet-20)
  - [OAuth 2.0 Cookbook by Adolfo Eloy Nascimento](https://www.amazon.com/dp/178829596X?tag=oauthnet-20)
- [OAuth articles by Alex Bilbie](https://alexbilbie.com/tag/oauth/)

### Protocols Built on OAuth 2.0

- [OpenID Connect](http://openid.net/connect/)
- [UMA](https://docs.kantarainitiative.org/uma/rec-uma-core.html)
- [IndieAuth](https://indieauth.spec.indieweb.org/)

## TODOs

- Photoprint: implement obtaining a profile, authenticating, and storing orders (to illustrate OpenId connect).
- Gallery: refresh token, support for other grants.
- Classic Web App: remaining security considerations.
- Mobile Application: all
- SPA: all
