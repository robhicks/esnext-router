export default class CallStack {
  constructor(router, extendObj) {
      this.stack = CallStack.global.slice(0);
      this.router = router;
      this.runCallback = true;
      this.callbackRan = false;
      this.propagateEvent = true;
      this.value = router.path();

      for (let key in extendObj) {
        this[key] = extendObj[key];
      }
      return this;
    }
    /**
     * Prevent a callback from being called
     *
     * @return {this} CallStack
     */
  preventDefault() {
    this.runCallback = false;
  };
  /**
   * Prevent any future callbacks from being called
   *
   * @return {self} CallStack
   */
  stopPropagation() {
    this.propagateEvent = false;
  };
  /**
   * Get parent state
   *
   * @return {Object} Previous state
   */
  parent() {
    const hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
    return (hasParentEvents) ? this.previousState : false;
  };
  /**
   * Run a callback (calls to next)
   *
   * @return {self} CallStack
   */
  callback() {
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
  enqueue(handler, atIndex) {
    const handlers = (!Array.isArray(handler)) ? [handler] : ((atIndex < handler.length) ? handler.reverse() : handler);

    while (handlers.length) {
      this.stack.splice(atIndex || this.stack.length + 1, 0, handlers.shift());
    }

    return this;
  };
  /**
   * Call to next item in stack -- this adds the `req`, `event`, and `next()` arguments to all middleware
   *
   * @return {self} CallStack
   */
  next() {
    // console.log("next():this.stack", this.stack)
    return this.stack.shift().call(this.router, this.req, this, () => {
      this.next.call(this);
    })
  };
}

CallStack.global = [];
