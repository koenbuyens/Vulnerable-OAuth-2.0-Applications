# Classic Web Application: Authorization Code Grant Flow

In this Section, we elaborate on using OAuth 2.0 with a classic web application as Client. In our running example, the third-party website `photoprint` enables users to print the pictures hosted at our gallery site. The `photoprint` application uses the *Authorization Code Grant*.

![Authorization Code Grant](./pics/AuthorizationCodeGrant.png)

The interactions between `gallery` and `photoprint` are as follows (major use case).

1. A user, let's call her Vivian, navigates to the printing website, `photoprint`. This website is called the `Client`. Vivian uploaded the pictures to picture gallery site (`gallery`). The printing website offers the possibility to obtain pictures from the gallery site via a button that says *“Print pictures from Gallery”*. Vivian clicks that button.
    ![The Print Button on photoprint.](./pics/printpicturesfromgallery.png)
2. The client redirects her to an Authorization Server (AS; Authorization Endpoint). In our case, hosted by `gallery`.

    ```http
    GET /oauth/authorize?redirect_uri=http%3A%2F%2Fphotoprint%3A3000%2Fcallback
      &scope=view_gallery&response_type=code&client_id=photoprint HTTP/1.1
    Host: gallery:3005
    Connection: keep-alive
    Referer: http://photoprint:3000/
    ```

    As you notice, the URI contains the parameters `redirect_uri`, `scope`, `response_type`, and `client_id`. The `redirect_uri` is where `gallery` will redirect Vivian after having created an authorization code. The `scope` is the access level that the client needs (`view_gallery` is a custom scope that enables clients to view the pictures from a user's gallery). The `response_type` is `code` as we want to use the authorization code grant. The `client_id` is an identifier that represents the `photoprint` application.
3. That server allows Vivian to authenticate to the gallery site and asks her if she consents to the Client `photoprint` accessing her pictures.
    ![Vivian can authenticate to the gallery site.](./pics/authcodegrant-dialog.png)
4. Assuming that Vivian gives her consent, the AS generates an Authorization Code (Authorization Grant) and sends it back to Vivian’s browser with a redirect command toward the return URL specified by the Client `photoprint` (in step 2).

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

    Note that the *Authorization Code* is part of that URL.
5. The browser honors the redirect and passes the Authorization Code to the Client (`photoprint`).

    ```http
    GET /callback?code=630111c5-3c53-452f-ac8b-ad4e166aff76 HTTP/1.1
    Host: photoprint:3000
    Connection: keep-alive
    Referer: http://gallery:3005/oauth/authorize?redirect_uri=
      http%3A%2F%2Fphotoprint%3A3000%2Fcallback&scope=view_gallery
      &response_type=code&client_id=photoprint
    ```

    The Authorization Code is part of that URL.
6. The Client `photoprint` forwards that Authorization Code together with its own credentials to the AS (Token Endpoint) at `gallery`. From this step on, the interactions are server-to-server. The Authorization Code proves that Vivian consented to the actions that the Client `photoprint` wants to do. Moreover, the message contains the Client’s own credentials (the Client ID and the Client Secret).

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

    The request contains the parameters `authorization_code`, `redirect_uri`, `grant_type`, `client_id`, and `client_secret`. The `authorization_code` is a proof that the user approved this client to access their resources. The `grant_type` is the type of the code that was delivered (i.e., an `authorization_code`). The `redirect_uri` is the URI where the *Access Tokens* will be delivered. The `client_id` and the `client_secret` authenticate the client. They are typically part of a Basic Authorization header, but `gallery` also accepts them as parameters in the body of the request.
7. Assuming that the Client `photoprint` is allowed to make requests, the Token Endpoint at the Authorization Server `gallery` issues the Client `photoprint` an Access Token. The AS may also issue a Refresh Token. The refresh token enables the Client `photoprint` to obtain new access tokens; e.g. when the old ones expire. Typically, refresh tokens are issued when `offline_access` is added to the scope in step 2.

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

    The server responds with an access token that the Client `photoprint` application can use to make calls to the API of Resource Server `gallery` (which offer access to Vivian’s pictures). Vivian is the Resource Owner, her pictures are Protected Resources (PRs), while the gallery site is the Resource Server (RS).
8. The Client `photoprint` then uses the access token to access a Protected Resource, Vivian's pictures, on the Resource Server `gallery`.

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

Navigation:

- Read [Developer: Minor Design Decisions and Insecure Implementation](authorizationcode_developer.md) to understand the common security pitfals and how to avoid them. 
- Read [Tester: Exploit Mistakes](authorizationcode_tester.md) to understand how you can detect and exploit those common mistakes.
- Read [README](README.md#an-oauth-20-enabled-application-architecture-design-implementation-and-testing-common-mistakes) to go back to the original readme file.