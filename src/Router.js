/****
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
 *
 * This is a port of Grapnel to es2015 and with it limited to the browser.
 *
 * https://github.com/baseprime/grapnel
 */
import CallStack from './CallStack.js';
import Request from './Request.js';

export default class Router {
  constructor(opts) {
    this.events = {}; // Event Listeners
    this.state = null; // Router state object
    this.options = opts || {}; // Options
    this.options.env = this.options.env || 'client';
    this.options.mode = this.options.pushState ? 'pushState' : 'hashchange';
    this.version = '1.0.0';

    window.addEventListener('popstate', (e) => {
      this.trigger('hashchange');
    });

    window.addEventListener('popstate', (e) => {
      if (this.state && this.state.previousState === null) return false;
      this.trigger('navigate')
    });
    return this;
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
  regexRoute(path, keys, sensitive, strict) {
    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';
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
  }

  get(route) {
    return this.add(route);
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
      const request = new Request(route, this);
      const eventName = 'navigate';

      const invoke = () => {
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
  bind(event, handler) {
    return this.on(event, handler);
  }
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
      // Set path
      if (this.options.mode === 'pushState') {
        frag = (this.options.root) ? (this.options.root + pathname) : pathname;
        window.history.pushState({}, null, frag);
      } else if (window.location) {
        window.location.hash = (this.options.hashBang ? '!' : '') + pathname;
      } else {
        window._pathname = pathname || '';
      }
      return this;
    } else if ('undefined' === typeof pathname) {
      // Get path
      if (this.options.mode === 'pushState') {
        frag = window.location.pathname.replace(this.options.root, '');
      } else if (this.options.mode !== 'pushState' && window.location) {
        frag = (window.location.hash) ? window.location.hash.split((this.options.hashBang ? '#!' : '#'))[1] : '';
      } else {
        frag = window._pathname || '';
      }
      return frag;
    } else if (pathname === false) {
      // Clear path
      if (this.options.mode === 'pushState') {
        window.history.pushState({}, null, this.options.root || '/');
      } else if (window.location) {
        window.location.hash = (this.options.hashBang) ? '!' : '';
      }

      return this;
    }
  }
}

Router.CallStack = CallStack;
Router.Request = Request;
