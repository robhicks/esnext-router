/****
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
 *
 * This is a port of Grapnel to es2015 and with it limited to the browser.
 *
 * https://github.com/baseprime/grapnel
 */
import CallStack from './CallStack.js';
import Request from './Request.js';
import regexRoute from './regexRoute.js';

export default class Router {
  constructor(options = {}) {
    this.events = {}; // Event Listeners
    this.state = null; // Router state object
    this.options = options; // Options
    this.version = '1.0.2';

    window.addEventListener('popstate', (e) => {
      if (this.state && this.state.previousState === null) return false;
      this.trigger('navigate')
    });
    return this;
  }

  addComponentAnchorEventListeners(componentDom) {
    const anchors = componentDom.querySelectorAll('a');
    anchors.forEach((link) => {
      link.addEventListener('click', (e) => {
        this.navigate(link.getAttribute('href'));
        e.preventDefault();
      })
    })
  }

  /**
   * Add an route and handler
   *
   * @param {String|RegExp} route name
   * @return {this} Router
   */
  add(route) {
      const middleware = Array.prototype.slice.call(arguments, 1, -1);
      const handler = Array.prototype.slice.call(arguments, -1)[0];
      const request = new Request(route);
      const eventName = 'navigate';

      // console.log("this", this)

      const invoke = () => {
        // console.log("this", this)
        // Build request parameters
        const req = request.parse(this.path());
        // Check if matches are found
        if (req.match) {
          // Match found
          const extra = {
            route: route,
            params: req.params,
            req: req,
            regex: req.match
          };
          // Create call stack -- add middleware first, then handler
          const stack = new CallStack(this, extra).enqueue(middleware.concat(handler));
          // Trigger main event
          this.trigger('match', stack, req);
          // Continue?
          if (!stack.runCallback) return this;
          // Previous state becomes current state
          stack.previousState = this.state;
          // Save new state
          this.state = stack;
          // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
          if (stack.parent() && stack.parent().propagateEvent === false) {
            stack.propagateEvent = false;
            return this;
          }
          // Call handler
          stack.callback();
        }
        // console.log("this", this)
        // Returns this
        return this;
      }
      
      return invoke().on(eventName, invoke);
    }
    /**
     * Fire an event listener
     *
     * @param {String} event name
     * @param {Mixed} [attributes] Parameters that will be applied to event handler
     * @return {self} Router
     */
  trigger(event) {
      const params = Array.prototype.slice.call(arguments, 1);
      // Call matching events
      if (this.events[event]) {
        this.events[event].forEach((fn) => {
          fn.apply(this, params)
        })
      }
      return this;
    }
    /**
     * Add an event listener
     *
     * @param {String} event name (multiple events can be called when separated by a space " ")
     * @param {Function} callback
     * @return {this} Router
     */
  on(event, handler) {
      const events = event.split(' ');
      events.forEach((event) => {
        if (this.events[event]) {
          this.events[event].push(handler);
        } else {
          this.events[event] = [handler];
        }
      })
      return this;
    }
    /**
     * Allow event to be called only once
     *
     * @param {String} event name(s)
     * @param {Function} callback
     * @return {self} Router
     */
  once(event, handler) {
      let ran = false;
      return this.on(event, () => {
        if (ran) return false;
        ran = true;
        handler.apply(this, arguments);
        handler = null;
        return true;
      })
    }
    /**
     * @param {String} Route context (without trailing slash)
     * @param {[Function]} Middleware (optional)
     * @return {Function} Adds route to context
     */
  context(context) {
      const middleware = Array.prototype.slice.call(arguments, 1);

      return () => {
        const value = arguments[0];
        const submiddleware = (arguments.length > 2) ? Array.prototype.slice.call(arguments, 1, -1) : [];
        const handler = Array.prototype.slice.call(arguments, -1)[0];
        const prefix = (context.slice(-1) !== '/' && value !== '/' && value !== '') ? context + '/' : context;
        const path = (value.substr(0, 1) !== '/') ? value : value.substr(1);
        const pattern = prefix + path;

        return this.add.apply(this, [pattern].concat(middleware).concat(submiddleware).concat([handler]));
      }
    }
    /**
     * Navigate through history API
     *
     * @param {String} Pathname
     * @return {self} Router
     */
  navigate(path) {
    return this.path(path).trigger('navigate');
  }

  path(pathname) {
    let frag;

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
  }

  /**
   * Create a RegExp Route from a string
   * This is the heart of the router and I've made it as small as possible!
   *
   * @param {String} Path of route
   * @param {Array} Array of keys to fill
   * @param {Bool} Case sensitive comparison
   * @param {Bool} Strict mode
   */
  static regexRoute(path, keys, sensitive, strict) {
    return regexRoute(path, keys, sensitive, strict);
  }

  static listen(opts = {}, routes = {}) {
    return (() => {
      for (let key in routes) {
        this.add.call(this, key, routes[key])
      }
      return this;
    }).call(new Grapnel(opts));
  }
}

Router.CallStack = CallStack;
Router.Request = Request;
