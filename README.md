Router
==========

#### Tiny es2015 JavaScript Router with name parameters, HTML5 pushState and Middleware support.

## Why Another Router

I needed/wanted a small client-size router for use in an es2015 app. I found [Grapnel](https://github.com/baseprime/grapnel).
It had all the features but had 2 drawbacks. It attempts to be both a client and server browser. And
it doesn't load in an es2015 app using an import statement. So I rewrote it as an es2015 Router. 

## Download/Installation

**Install with npm**
```bash
npm install es2015-router
```
**Or by using jspm:**
```bash
jspm install es2015-router
```

# es2015 router Features

- Supports routing using `pushState` or `hashchange` concurrently
- Supports Named Parameters similar to Sinatra, Restify, and Express
- Middleware Support
- Works on the client or server-side
- RegExp Support
- RequreJS/AMD, Browserify, and CommonJS Compatibility
- Supports `#` or `#!` for `hashchange` routing
- Unobtrusive, supports multiple routers on the same page
- No dependencies

## Basic Router

```javascript
import Router from 'es2015-router';
const router = new Router();

router.get('products/:category/:id?', function(req){
    const id = req.params.id,
        category = req.params.category;
    // GET http://mysite.com/#products/widgets/134
    console.log(category, id);
    // => widgets 134
});
```

## Using pushState

```javascript
import Router from 'es2015-router';
const router = new Router({ pushState : true });

router.get('/products/:category/:id?', function(req){
    const id = req.params.id,
        category = req.params.category

    console.log(category, id);
});

router.navigate('/products/widgets/134');
// => widgets 134
```

## Named Parameters

es2015 router supports regex style routes similar to Sinatra, Restify, and Express. The properties are mapped to the parameters in the request.
```javascript
router.get('products/:id?', function(req){
    // GET /file.html#products/134
    req.params.id
    // => 134
});

router.get('products/*', function(req){
    // The wildcard/asterisk will match anything after that point in the URL
    // Parameters are provided req.params using req.params[n], where n is the nth capture
});
```

## Middleware Support

es2015 router also supports middleware:

```javascript
const auth = function(req, event, next){
    user.auth(function(err){
        req.user = this;
        next();
    });
}

router.get('/*', auth, function(req){
    console.log(req.user);
});
```

## Route Context

You can add context to a route and even use it with middleware:

```javascript
const usersRoute = router.context('/user/:id', getUser, getFollowers); // Middleware can be used here

usersRoute('/', function(req, event){
    console.log('Profile', req.params.id);
});

usersRoute('/followers', otherMiddleware, function(req, event){ // Middleware can be used here too
    console.log('Followers', req.params.id);
});

router.navigate('/user/13589');
// => Profile 13589

router.navigate('/user/13589/followers');
// => Followers 13589
```

## Declaring Multiple Routes

```javascript
const routes = {
    'products' : function(req){
        // GET /file.html#products
    },
    'products/:category/:id?' : function(req){
        // GET /file.html#products/widgets/35
        req.params.category
        // => widgets
    }
}

router.listen(routes);
```

## Event Handling

```javascript
import Router from 'es2015-router';
const router = new Router({ pushState : true, root : '/' });

router.on('navigate', function(event){
    // GET /foo/bar
    console.log('URL changed to %s', this.path());
    // => URL changed to /foo/bar
});
```

## RegExp Support

es2015 router allows RegEx when defining a route:

```javascript
import Router from 'es2015-router';
const expression = /^food\/tacos\/(.*)$/i;
const router = new Router();

router.get(expression, function(req, event){
    // GET http://mysite.com/page#food/tacos/good
    console.log('I think tacos are %s.', req.params[0]);
    // => "He thinks tacos are good."
});
```

## Enabling PushState
```javascript
const router = new Router({ pushState : true });
```
You can also specify a root URL by setting it as an option:

```javascript
const router = new Router({ root : '/public/search/', pushState : true });
```
The root may require a beginning slash and a trailing slash depending on how your application utilizes the router.

## Middleware
es2015-router uses middleware similar to how Express uses middleware. Middleware has access to the `req` object, `event` object, and the next middleware in the call stack (commonly denoted as `next`). Middleware must call `next()` to pass control to the next middleware, otherwise the router will stop.

For more information about how middleware works, see [Using Middleware](http://expressjs.com/guide/using-middleware.html).
```javascript
const user = function(req, event, next){
    user.get(function(err){
        req.user = this;
        next();
    });
}

router.get('/user/*', user, function(req){
    console.log(req.user);
});
```

## Navigation
If pushState is enabled, you can navigate through your application with `router.navigate`:
```javascript
router.navigate('/products/123');
```

## Stopping a Route Event
```javascript
router.on('match', function(event){
    event.preventDefault(); // Stops event handler
});
```

## Stopping Event Propagation
```javascript
router.get('/products/:id', function(req, event){
    event.stopPropagation(); // Stops propagation of the event
});

router.get('/products/widgets', function(req, event){
    // This will not be executed
});

router.navigate('/products/widgets');
```

## 404 Pages
You can specify a route that only uses a wildcard `*` as your final route, then use `event.parent()` which returns `false` if the call stack doesn't have any other routes to run.
```javascript
const routes = {
    '/' : function(req, e){
        // Handle route
    },
    '/store/products/:id' : function(req, e){
        // Handle route
    },
    '/category/:id' : function(req, e){
        // Handle route
    },
    '/*' : function(req, e){
        if(!e.parent()){
            // Handle 404
        }
    }
}

router.listen({ pushState : true }, routes);
```

&nbsp;

***

# API Documentation

##### `get` Adds a listeners and middleware for routes
```javascript
/**
 * @param {String|RegExp} path
 * @param {Function} [[middleware], callback]
*/
router.get('/store/:category/:id?', function(req, event){
    const category = req.params.category,
        id = req.params.id;

    console.log('Product #%s in %s', id, category);
});
```

##### `navigate` Navigate through application
```javascript
/**
 * @param {String} path relative to root
*/
router.navigate('/products/123');
```

##### `on` Adds a new event listener
```javascript
/**
 * @param {String} event name (multiple events can be called when separated by a space " ")
 * @param {Function} callback
*/
router.on('myevent', function(event){
    console.log('router works!');
});
```

##### `once` A version of `on` except its handler will only be called once
```javascript
/**
 * @param {String} event name (multiple events can be called when separated by a space " ")
 * @param {Function} callback
*/
router.once('init', function(){
    console.log('This will only be executed once');
});
```

##### `trigger` Triggers an event
```javascript
/**
 * @param {String} event name
 * @param {Mixed} [attributes] Parameters that will be applied to event handler
*/
router.trigger('event', eventArg1, eventArg2, etc);
```

##### `context` Returns a function that can be called with a specific route in context.
Both the `router.context` method and the function it returns can accept middleware. **Note: when calling `route.context`, you should omit the trailing slash.**
```javascript
/**
 * @param {String} Route context (without trailing slash)
 * @param {[Function]} Middleware (optional)
 * @return {Function} Adds route to context
*/
const usersRoute = router.context('/user/:id');

usersRoute('/followers', function(req, event){
    console.log('Followers', req.params.id);
});

router.navigate('/user/13589/followers');
// => Followers 13589
```

##### `path`
* `router.path('string')` Sets a new path or hash
* `router.path()` Gets path or hash
* `router.path(false)` Clears the path or hash

##### `bind` An alias of `on`
##### `add` An alias of `get`
##### `fragment` (Deprecated)

## Options
* `pushState` Enable pushState, allowing manipulation of browser history instead of using the `#` and `hashchange` event
* `root` Root of your app, all navigation will be relative to this
* `hashBang` Enable `#!` as the anchor of a `hashchange` router instead of using just a `#`

## Events
* `navigate` Fires when router navigates through history
* `match` Fires when a new match is found, but before the handler is called
* `hashchange` Fires when hashtag is changed

## License
##### [MIT License](http://opensource.org/licenses/MIT)
