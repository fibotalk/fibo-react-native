# fibo-react-native

## Getting started

`$ npm install fibo-react-native --save`
`$ yarn add fibo-react-native`

# Usage
```javascript
import Fibotalk from 'fibo-react-native';

let fibo = new Fibotalk('<appid>');

// Set user info and account info
fibo.fibotalkSettings = {
    user: {
        ...
        userId: "unique user id"    // mandatory
        ...
    },
    account: {
        ...
        accountId: "unique account id"      // mandatory
        ...
    }
};

// Track login event:
fibo.setEvent("login");

// Track signup event:
fibo.setEvent("signup");

// Track any custom event:
fibo.setEvent("event_name", { /* dimensions/values specific to this event */ });
```