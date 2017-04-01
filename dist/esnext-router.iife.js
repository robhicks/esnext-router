var EsnextRouter = (function () {
'use strict';

var CallStack = function CallStack(router, extendObj) {
    var this$1 = this;

    this.stack = CallStack.global.slice(0);
    this.router = router;
    this.runCallback = true;
    this.callbackRan = false;
    this.propagateEvent = true;
    this.value = router.path();

    for (var key in extendObj) {
      this$1[key] = extendObj[key];
    }
    return this;
  };
  /**
   * Prevent a callback from being called
   *
   * @return {this} CallStack
   */
CallStack.prototype.preventDefault = function preventDefault () {
  this.runCallback = false;
};
/**
 * Prevent any future callbacks from being called
 *
 * @return {self} CallStack
 */
CallStack.prototype.stopPropagation = function stopPropagation () {
  this.propagateEvent = false;
};
/**
 * Get parent state
 *
 * @return {Object} Previous state
 */
CallStack.prototype.parent = function parent () {
  var hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
  return (hasParentEvents) ? this.previousState : false;
};
/**
 * Run a callback (calls to next)
 *
 * @return {self} CallStack
 */
CallStack.prototype.callback = function callback () {
  this.callbackRan = true;
  this.timeStamp = Date.now();
  this.next();
};
/**
 * Add handler or middleware to the stack
 *
 * @param {Function|Array} Handler or a array of handlers
 * @param {Int} Index to start inserting
 * @return {self} CallStack
 */
CallStack.prototype.enqueue = function enqueue (handler, atIndex) {
    var this$1 = this;

  var handlers = (!Array.isArray(handler)) ? [handler] : ((atIndex < handler.length) ? handler.reverse() : handler);

  while (handlers.length) {
    this$1.stack.splice(atIndex || this$1.stack.length + 1, 0, handlers.shift());
  }

  return this;
};
/**
 * Call to next item in stack -- this adds the `req`, `event`, and `next()` arguments to all middleware
 *
 * @return {self} CallStack
 */
CallStack.prototype.next = function next () {
    var this$1 = this;

  // console.log("next():this.stack", this.stack)
  return this.stack.shift().call(this.router, this.req, this, function () {
    this$1.next.call(this$1);
  })
};

CallStack.global = [];

var regexRoute = function(path, keys, sensitive, strict) {

  if (path instanceof RegExp) { return path; }
  if (path instanceof Array) { path = '(' + path.join('|') + ')'; }
  // Build route RegExp
  path = path.concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/\+/g, '__plus__')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional) {
      keys.push({
        name: key,
        optional: !!optional
      });
      slash = slash || '';

      return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/__plus__/g, '(.+)')
    .replace(/\*/g, '(.*)');

  return new RegExp('^' + path + '$', sensitive ? '' : 'i');

};

var Request = function Request(route) {
  this.route = route;
  this.keys = [];
  this.regex = regexRoute(route, this.keys);
  return this;
};
/**
 * Match a path string -- returns a request object if there is a match -- returns false otherwise
 *
 * @return {Object} req
 */
Request.prototype.parse = function parse (path) {
  var match = path.match(this.regex);

  var req = {
    params: {},
    keys: this.keys,
    matches: (match || []).slice(1),
    match: match
  };
  // Build parameters
  req.matches.forEach(function (value, i) {
    if (self.keys) {
      var key = (self.keys[i] && self.keys[i].name) ? self.keys[i].name : i;
      // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
      req.params[key] = (value) ? decodeURIComponent(value) : undefined;
    }
  });

  return req;
};

/****
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
 *
 * This is a port of Grapnel to es2015 and with it limited to the browser.
 *
 * https://github.com/baseprime/grapnel
 */
var Router = function Router(options) {
  var this$1 = this;
  if ( options === void 0 ) options = {};

  this.events = {}; // Event Listeners
  this.state = null; // Router state object
  this.options = options; // Options
  this.version = '1.0.2';

  window.addEventListener('popstate', function (e) {
    if (this$1.state && this$1.state.previousState === null) { return false; }
    this$1.trigger('navigate');
  });
  return this;
};

Router.prototype.addComponentAnchorEventListeners = function addComponentAnchorEventListeners (componentDom) {
    var this$1 = this;

  var anchors = componentDom.querySelectorAll('a');
  anchors.forEach(function (link) {
    link.addEventListener('click', function (e) {
      this$1.navigate(link.getAttribute('href'));
      e.preventDefault();
    });
  });
};

/**
 * Add an route and handler
 *
 * @param {String|RegExp} route name
 * @return {this} Router
 */
Router.prototype.add = function add (route) {
      var this$1 = this;

    var middleware = Array.prototype.slice.call(arguments, 1, -1);
    var handler = Array.prototype.slice.call(arguments, -1)[0];
    var request = new Request(route);
    var eventName = 'navigate';

    // console.log("this", this)

    var invoke = function () {
      // console.log("this", this)
      // Build request parameters
      var req = request.parse(this$1.path());
      // Check if matches are found
      if (req.match) {
        // Match found
        var extra = {
          route: route,
          params: req.params,
          req: req,
          regex: req.match
        };
        // Create call stack -- add middleware first, then handler
        var stack = new CallStack(this$1, extra).enqueue(middleware.concat(handler));
        // Trigger main event
        this$1.trigger('match', stack, req);
        // Continue?
        if (!stack.runCallback) { return this$1; }
        // Previous state becomes current state
        stack.previousState = this$1.state;
        // Save new state
        this$1.state = stack;
        // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
        if (stack.parent() && stack.parent().propagateEvent === false) {
          stack.propagateEvent = false;
          return this$1;
        }
        // Call handler
        stack.callback();
      }
      // console.log("this", this)
      // Returns this
      return this$1;
    };
      
    return invoke().on(eventName, invoke);
  };
  /**
   * Fire an event listener
   *
   * @param {String} event name
   * @param {Mixed} [attributes] Parameters that will be applied to event handler
   * @return {self} Router
   */
Router.prototype.trigger = function trigger (event) {
      var this$1 = this;

    var params = Array.prototype.slice.call(arguments, 1);
    // Call matching events
    if (this.events[event]) {
      this.events[event].forEach(function (fn) {
        fn.apply(this$1, params);
      });
    }
    return this;
  };
  /**
   * Add an event listener
   *
   * @param {String} event name (multiple events can be called when separated by a space " ")
   * @param {Function} callback
   * @return {this} Router
   */
Router.prototype.on = function on (event, handler) {
      var this$1 = this;

    var events = event.split(' ');
    events.forEach(function (event) {
      if (this$1.events[event]) {
        this$1.events[event].push(handler);
      } else {
        this$1.events[event] = [handler];
      }
    });
    return this;
  };
  /**
   * Allow event to be called only once
   *
   * @param {String} event name(s)
   * @param {Function} callback
   * @return {self} Router
   */
Router.prototype.once = function once (event, handler) {
      var arguments$1 = arguments;
      var this$1 = this;

    var ran = false;
    return this.on(event, function () {
      if (ran) { return false; }
      ran = true;
      handler.apply(this$1, arguments$1);
      handler = null;
      return true;
    })
  };
  /**
   * @param {String} Route context (without trailing slash)
   * @param {[Function]} Middleware (optional)
   * @return {Function} Adds route to context
   */
Router.prototype.context = function context (context$1) {
      var arguments$1 = arguments;
      var this$1 = this;

    var middleware = Array.prototype.slice.call(arguments, 1);

    return function () {
      var value = arguments$1[0];
      var submiddleware = (arguments$1.length > 2) ? Array.prototype.slice.call(arguments$1, 1, -1) : [];
      var handler = Array.prototype.slice.call(arguments$1, -1)[0];
      var prefix = (context$1.slice(-1) !== '/' && value !== '/' && value !== '') ? context$1 + '/' : context$1;
      var path = (value.substr(0, 1) !== '/') ? value : value.substr(1);
      var pattern = prefix + path;

      return this$1.add.apply(this$1, [pattern].concat(middleware).concat(submiddleware).concat([handler]));
    }
  };
  /**
   * Navigate through history API
   *
   * @param {String} Pathname
   * @return {self} Router
   */
Router.prototype.navigate = function navigate (path) {
  return this.path(path).trigger('navigate');
};

Router.prototype.path = function path (pathname) {
  var frag;

  if ('string' === typeof pathname) {
    frag = (this.options.root) ? (this.options.root + pathname) : pathname;
    window.history.pushState({}, null, frag);
    return this;
  } else if ('undefined' === typeof pathname) {
    // Get path
    frag = window.location.pathname.replace(this.options.root, '');
    return frag;
  } else if (pathname === false) {
    window.history.pushState({}, null, this.options.root || '/');
    return this;
  }
};

/**
 * Create a RegExp Route from a string
 * This is the heart of the router and I've made it as small as possible!
 *
 * @param {String} Path of route
 * @param {Array} Array of keys to fill
 * @param {Bool} Case sensitive comparison
 * @param {Bool} Strict mode
 */
Router.regexRoute = function regexRoute$1 (path, keys, sensitive, strict) {
  return regexRoute(path, keys, sensitive, strict);
};

Router.listen = function listen (opts, routes) {
    var this$1 = this;
    if ( opts === void 0 ) opts = {};
    if ( routes === void 0 ) routes = {};

  return (function () {
    for (var key in routes) {
      this$1.add.call(this$1, key, routes[key]);
    }
    return this$1;
  }).call(new Grapnel(opts));
};

Router.CallStack = CallStack;
Router.Request = Request;

return Router;

}());
