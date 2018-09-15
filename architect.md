# Architect: Major Design Decisions

Now that we know what OAuth 2.0 is typically used for, we elaborate on the major design decisions that architects face when designing an OAuth 2.0 enabled application.

- [Architect: Major Design Decisions](#architect-major-design-decisions)
  - [Use the Authorization Code Grant for Classic Web Applications and Native Mobile Apps](#use-the-authorization-code-grant-for-classic-web-applications-and-native-mobile-apps)
  - [Use Refresh Tokens When You Trust the Client to Store Them Securely](#use-refresh-tokens-when-you-trust-the-client-to-store-them-securely)
  - [Use Handle-Based Tokens Outside Your Network](#use-handle-based-tokens-outside-your-network)
  - [Selecting the Token Type](#selecting-the-token-type)
  - [Use Bearer Tokens When You do not Care to Whom They Were Issued](#use-bearer-tokens-when-you-do-not-care-to-whom-they-were-issued)
  - [Combining Authorization Server and Resource Server](#combining-authorization-server-and-resource-server)
  - [Checklist](#checklist)

## Use the Authorization Code Grant for Classic Web Applications and Native Mobile Apps

A major design decision is deciding which flows to support. This largely depends on the type of clients the application supports. [Auth0 provides an excellent flow chart that helps making a good  decision](https://auth0.com/docs/api-auth/which-oauth-flow-to-use). In summary, if the *Client* is:

- A classic web application, use the Authorization Code Grant.
- A single page application, use the Implicit Grant.
- A native mobile application, use the [Authorization Code Grant with PKCE](https://tools.ietf.org/html/rfc7636).
- A client that is absolutely trusted with user credentials (i.e. the Facebook app accessing Facebook), use the Resource Owner Password Grant.
- A client that is the owner of the data, use the Client Credentials Grant.

![A decision tree that helps an architect to decide which OAuth 2.0 flows to support](./pics/DecisionTreeFlow.png)

Using an incorrect flow for a client has various security implications. For instance, using the Resource Owner Password Grant for third-party mobile applications, gives those mobile applications access to the user's credentials. These credentials allow those applications to access all of the user data, as they can just login as the user itself. This is probably something you want to avoid.

In the subsequent sections, we show how to use OAuth 2.0 when using a [Classic Web Application](#classic-web-application-authorization-code-grant-flow), a [Single Page Application](#single-page-application-implicit-grant-flow), and a first-party and third-party [Mobile Application](#mobile-application-authorization-code-grant-with-pkce) as clients. For each of these sections, we  elaborate on the overall design, implement that design, and touch upon common security mistakes.

## Use Refresh Tokens When You Trust the Client to Store Them Securely

OAuth 2.0 uses two types of tokens, namely Access Tokens and Refresh Tokens.

- ***Access Tokens*** are tokens that the *Client* gives to the API to access *Resources*.
- ***Refresh Tokens*** are tokens that the *Client* can use to obtain a new *Access Token* once the old one expires.

Think of Access Tokens [like a session that is created once you authenticate to a website](https://nordicapis.com/api-security-oauth-openid-connect-depth/). As long as that session is valid, we can interact with that website without needing to login again. Once the session times out, we would need to login again with our username and password. Refresh tokens are like that password, as they allow a *Client* to create a new session.

Just like passwords, it is important that the *Client* stores these *Refresh Tokens* securely. If you do not trust that the client will store those tokens securely, do not issue *Refresh Tokens*. An attacker with access to the *Refresh Tokens* can obtain new *Access Tokens* and use those *Access tokens* to access a user's *Resources*. The main downside of not using *Refresh Tokens* is that users/clients would need to re-authenticate every time the *Access Token* expires.

**Note** that public clients should not be issued refresh tokens.

![A decision tree that helps an architect to decide whether to support refresh tokens](./pics/DecisionTreeRefreshToken.png)

## Use Handle-Based Tokens Outside Your Network

There are two ways to pass the above tokens throughout the system, namely:

- ***Handle-based Tokens*** are typically random strings that can be used to retrieve the data associated with that token. This is similar to passing a variable by reference in a programming language.
- ***Self-contained Tokens*** are tokens that contain all the data associated with that token. This is similar to passing a variable by value in a programming language.

To increase maintainability, [use self-contained tokens within your network, but use handle-based tokens outside of it](https://www.youtube.com/watch?v=BdKmZ7mPNns). The main reason is that *Access Tokens* are meant to be consumed by the API itself, not by the *Client*. If we share self-contained tokens with Clients, they might consume these tokens in ways that we had not intended. Changing the content (or structure) of our self-contained tokens might thus break lots of *Client* applications (in ways we had not foreseen).

If *Client applications* require access to data that is in the self-contained token, [offer an API](http://tools.ietf.org/html/rfc7662) that enables *Client* applications to obtain information related to that *Access Token*. If we want to use self-contained tokens and prevent clients from accessing the contents, encrypt those tokens.

![A decision tree that helps an architect decide whether to support handle-based tokens](./pics/handle-based-tokens.png)

## Selecting the Token Type

The OAuth 2.0 spec does not specify the types of tokens that can be used and as such we, as architects, must select a token type that makes sense for our application. Applications typically use on of the following token types:

- ***[JSON Web Tokens (JWTs)](https://tools.ietf.org/html/rfc7523)*** are self-contained tokens expressed as a [JavaScript Object Notation (JSON)](https://tools.ietf.org/html/rfc7159) structure. JWTs are part of the [JSON Identity Suite](https://www.slideshare.net/2botech/the-jsonbased-identity-protocol-suite). Other things in this suite include [JSON Web Algorithms (JWA)](https://tools.ietf.org/html/rfc7518) for expressing algorithms, [JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517) for representing keys, [JSON Web Encryption (JWE)](https://tools.ietf.org/html/rfc7516) for encryption, and [JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515) for signatures. These RFCs are typically used by OAuth applications as well as by [OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html).
- ***Custom tokens*** are typically handle-based tokens that store non-standardized information associated with the handle in a database.
- ***[WS-Security tokens](https://tools.ietf.org/html/rfc7522)*** and SAML tokens are typically supported for applications that rely extensively on SAML.

Selecting the token type depends on application constraints. For instance, if the application heavily relies on SAML tokens, it might be best to use the SAML profile. Otherwise, JWTs or custom tokens might be used. Usage of JWTs as  OAuth 2.0 Bearer tokens is recommended when the APIs of the application have been implemented by various partners; e.g. an application using a Micro Service Architecture where the different services are offered by different companies. Each of those token types will have different security considerations to use them securely, but those considerations are not a major factor in selecting one.

![A decision tree that helps an architect to select a token type](./pics/selecting-token-type.png)

## Use Bearer Tokens When You do not Care to Whom They Were Issued

OAuth supports different token profiles, namely:

- ***[Bearer tokens](https://tools.ietf.org/html/rfc6750)*** are like concert tickets: the venue does not care to who the ticket was issued; it lets you attend the concert if you have the ticket regardless of who bought it originally. The API (*Resource Server*) does not care who presents the Bearer token, it gives the *Client* access if it is a valid token.
- ***[Holder of Key tokens](https://tools.ietf.org/html/rfc7800)*** are like debit cards: you can only use it if you provide a PIN that unlocks the card. This PIN assures the merchant that the one using the card is the one to whom it was issued. Holder of Key Tokens cannot be used without proof of possession.

For most applications, Bearer tokens are sufficient. The main downside of using them is that if attackers obtains *Access Tokens*, they can use them.

## Combining Authorization Server and Resource Server

The OAuth 2.0 protocol defines the concepts of an *Authorization Server* (where a user gives consent to allow an application to access its resources) and a *Resource Server* (i.e. the API that an application can access). Both servers can be deployed on the same server or they also may be deployed to different servers.

If you are using a micro-service oriented architecture, it is best practice to separate both server types into different entities, otherwise they can be merged into one.

![A decision tree that helps an architect to decide whether to combine authorization and resource server](./pics/combining-authorization-resource-server.png)

## Checklist

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