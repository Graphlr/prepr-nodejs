Prepr REST API for Node.js
================================

This repository contains the open source Node.js client for Prepr REST API.

Requirements
------------

- Create a new `access token` in the [developers](https://signin.prepr.io/settings/development/access-tokens)
- Prepr REST API for Node.js requires Node.js >= 0.10


Installation
------------

`npm install prepr`


Usage
-----

Initialize the library first. Don't forget to replace `<YOUR_ACCESS_TOKEN>` with your access token.

```javascript
var prepr = require('prepr')('<YOUR_ACCESS_TOKEN>');
```

Now we can send API requests through node. Let's use getting your publications overview as an example:

```javascript
// Get publications
prepr.get('/publications', function (err, data) {
  if (err) {
    return console.log(err);
  }
  console.log(data);
});

// Result
{
  "items": [],
  "total": 0,   
  "after": "YWZ0ZXJfMjU=",
  "before": "YmVmb3JlXzA=",
  "skip": 0,
  "limit": 25
}
```