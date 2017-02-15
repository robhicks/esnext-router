import regexRoute from './regexRoute.js';

export default class Request {
  constructor(route) {
    this.route = route;
    this.keys = [];
    this.regex = regexRoute(route, this.keys);
    return this;
  }
  /**
   * Match a path string -- returns a request object if there is a match -- returns false otherwise
   *
   * @return {Object} req
   */
  parse(path) {
    const match = path.match(this.regex);

    const req = {
      params: {},
      keys: this.keys,
      matches: (match || []).slice(1),
      match
    };
    // Build parameters
    req.matches.forEach((value, i) => {
      if (self.keys) {
        const key = (self.keys[i] && self.keys[i].name) ? self.keys[i].name : i;
        // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
        req.params[key] = (value) ? decodeURIComponent(value) : undefined;
      }
    });

    return req;
  };
}
