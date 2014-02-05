/*
 * brief.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/brief.js/blob/master/LICENSE
 */

/*
 * UMD (Universal Module Definition)
 * see https://github.com/umdjs/umd/blob/master/returnExports.js
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    /*
     * AMD. Register as an anonymous module.
     */
    define([], factory);
  } else if (typeof exports === 'object') {
    /*
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like enviroments that support module.exports,
     * like Node.
     */
    module.exports = factory();
  } else {
    /*
     * Browser globals (root is window)
     */
    root.brief = factory(document, Element, Array);
  }
}(this, function(document, Element, Array) {
  'use strict';
    /*
     * Main function that we will use to create brief object
     */
    var create;
    /*
     * For delegated listeners, we will need to manage a list of callbacks
     */
    var managedListeners = {};
    /*
     * We need to save references to some prototype methods that
     * we will need later
     */
    var arr = Array.prototype;
    var el = Element.prototype;
    var slice = arr.slice;
    var splice = arr.splice;
    var forEach = arr.forEach;
    var push = arr.push;
    var pop = arr.pop;
    var filter = arr.filter;
    var matchFunction = (
      el.matchesSelector ||
      el.msMatchesSelector ||
      el.mozMatchesSelector ||
      el.webkitMatchesSelector ||
      el.oMatchesSelector
    );
    /*
     * This function will use whatever matchesSelector function
     * is available for that browser
     */
    var match = function(el, selector) {
      return matchFunction.call(el, selector);
    };
    /*
     * The brief function will create and return a new brief object (array-like)
     */
    var brief = function(selector, context) {
      return new brief.proto.create(selector, context);
    };
    brief.proto = brief.prototype = {
      length: 0,
      isBrief: true,
      splice: function() {
        splice.apply(this, slice.call(arguments, 0));
        return this;
      },
      push: function() {
        push.apply(this, slice.call(arguments, 0));
        return this;
      },
      pop: function() {
        pop.apply(this);
        return this;
      },
      toArray: function() {
        return slice.call(this, 0);
      },
      empty: function() {
        while(this.length > 0) {
          this.pop();
        }
        return this;
      },
      filter: function(selector) {
        var newBrief = filter.call(this, function(item) {
          return match(item, selector);
        });
        newBrief.selector = this.selector;
        return newBrief;
      },
      indexOf: function(selector) {
        var i = 0;
        for ( ; i < this.length; i++) {
          if (match(this[i], selector)) {
            return i;
          }
        }
        return -1;
      },
      get: function(index) {
        return this[index];
      },
      find: function(selector) {
        var newBrief = brief();
        var length = this.length;
        var i = 0;
        for (; i < length; i++) {
          push.apply(newBrief, slice.call(item.querySelectorAll(selector), 0));
        }
        newBrief.selector = this.selctor;
        return newBrief;
      },
      forEach: forEach,
      on: function(types, callback, delegatee, autoRemove) {
        var newFunction = callback;
        var me = this;
        var meLen = me.length;
        var i = 0;
        var typesLen = types.length;
        var element, type, j, listeners;
        if (typeof delegatee == 'boolean') {
          autoRemove = delegatee;
          delegatee = undefined;
        }
        /*
         * Since we want to support multiple listeners types
         * at once, we need to split up the types if they
         * passed in a string
         */
        if (typeof types == 'string') {
          types = types.split(' ');
          typesLen = types.length;
        }
        /*
         * If we are attempting to autoRemove this listener
         * we will have to override the callback so that it
         * automatically calls BriefObject.off and then
         * triggers the callback
         */
        if (autoRemove) {
          newFunction = function(event) {
            me.off(types, newFunction, false);
            callback.call(this, event);
          };
        }
        /*
         * We need to loop through each type that was passed
         * in so that we apply all the listeners correctly
         */
        for (; i < typesLen; i++) {
          /*
           * We need to reset j and get the current type
           */
          j = 0;
          type = types[i];
          /*
           * If we don't have a key in the object for this
           * listener type, than we need to create it
           */
          if (!managedListeners[type]) {
              managedListeners[type] = [];
          }
          /*
           * For each listener type, we need to go through each element
           * in the brief object and apply the listeners to each one
           */
          for (; j < meLen; j++) {
            /*
             * Set the current element
             */
            element = me[j];
            /*
             * If we aren't trying to delegate this listener than we
             * can just apply the listener to the element
             */
            if (!delegatee) {
              element.addEventListener(type, newFunction, false);
            /*
             * If we are delegating the listener, we have some work
             * on our hands
             */
            } else {
              /*
               * We need to grab the current listeners
               * that we are managing based on type
               */
              listeners = managedListeners[type];
              /*
               * We create a new function that only calls the callback
               * that was passed in, if it matches the selector
               */
              newFunction = function(event) {
                if (match(event.srcElement, delegatee)) {
                  if (autoRemove) {
                      me.off(type, callback, delegatee);
                  }
                  callback.call(this, event);
                }
              };
              /*
               * To avoid creating extra variables and whatnot,
               * we can store this extra data on the function itself
               */
              newFunction._element = element;
              newFunction._delegatedTo = delegatee;
              newFunction._originalCallback = callback;
              listeners[listeners.length || 0] = newFunction;
              element.addEventListener(type, newFunction, true);
            }
          }
        }
      },
      off: function(types, callback, delegatee) {
        var me = this;
        var i = 0;
        var typesLen = types.length;
        var meLen = me.length;
        var type, element, j, len, listeners, func;
        /*
         * Since we want to support multiple listeners types
         * at once, we need to split up the types if they
         * passed in a string
         */
        if (typeof types == 'string') {
          types = types.split(' ');
          typesLen = types.length;
        }
        /*
         * For each listener type, we need to go through each element
         * in the brief object and apply the listeners to each one
         */
        for (; i < typesLen; i++) {
          /*
           * We need to reset j and get the current type
           */
          j = 0;
          type = types[i];
          /*
           * For each listener type, we need to go through each element
           * in the brief object and apply the listeners to each one
           */
          for (; j < meLen; j++) {
            /*
             * Set the current element
             */
            element = me[j];
            /*
             * If the listener wasn't delegated, we can
             * just remove the listener from the element
             */
            if (!delegatee) {
              element.removeEventListener(type, callback, false);
            /*
             * If the listener was delegated, we have some
             * cleanup to do to get rid of the listener
             */
            } else {
              /*
               * We need to grab the current listeners
               * that we are managing based on type
               */
              listeners = managedListeners[type];
              len = listeners.length;
              /*
               * We need to loop through the listeners and only remove it
               * if the elements match and if it was delegated to the current
               * delegatee or if they passed in '*' as the delegatee selector
               */
              while (len--) {
                func = listeners[len];
                if (func._element == element && (func._delegatedTo == delegatee || func._delegatedTo == '*')) {
                  element.removeEventListener(type, func, true);
                  listeners.splice(len, 1);
                }
              }
            }
          }
        }
      },
      once: function() {
        var args = slice.call(arguments, 0);
        args.push(true);
        return brief.proto.on.apply(this, args);
      }
    };
    create = brief.proto.create = function(selector, context) {
      /*
       * Sometimes it could be possible to want a blank brief object.
       * In those cases, we can skip all this
       */
      if (selector || context) {
        /*
         * If we are dealing with a context and or a selector that are strings
         */
        if (typeof context == 'string' || !context && selector) {
          var r = document.querySelectorAll(this.selector = context || selector);
          push.apply(this, slice.call(r, 0));
        }
        /*
         * If we just grabbed the elements related to the context
         */
        if (this.selector == context) {
          this.find(selector);
        /*
         * If we are dealing with a context which is a brief object
         */
        } else if (context && context.isBrief) {
          push.apply(this, context.find(selector));
        /*
         * If we are dealing with an array like object or an HTML element
         */
        } else if (typeof context == 'object') {
          push.apply(this, context.length ? context : [context]);
          this.find(selector);
        }
      }
      return this;
    };
    create.prototype = brief.proto;
    return brief;
}.bind(this, document, Element, Array)));