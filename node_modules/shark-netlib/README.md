# Shark netlib

Install: `npm i shark-netlib`

Example:
```js

const shnet=require("shark-netlib");
shnet("https://example.com", true).then((data)=>{console.log(data.body);console.log(`SRC (IF REDIRECTION, CONTAIN URL WHERE THIS PROGRAMM GET data.body): ${data.redirectedto})`)}, (err)=>{console.error("an error occured");});//DETECT IF IT IS http or https and use the correct function
```

(SECOND ARG: FOLLOW REDIRECTS (bool))