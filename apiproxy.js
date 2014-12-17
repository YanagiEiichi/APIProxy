var APIProxy;
void function(){
  // Set global heap, it's used to hold callback functions.
  var heap = [];
  // Define the APIProxy constructor
  APIProxy = function(apihost) {
    // Set a queue, it's used to save invoking behavior before iframe loaded.
    var queue = [];
    // Create a IFRAME element, it's used to link to the proxy.html on API host.
    var iframe = document.createElement("iframe");
    // Declare the proxy variable, initialize it when iframe onload.
    // It's a `window` object for above iframe, we can call `.postMessage(...)` on it.
    var proxy;
    // Set `load` event with DOM level 0 for the iframe.
    iframe.onload = function(){
      iframe.onload = null;
      proxy = iframe.contentWindow;
      queue.reverse();
      while(queue.length) launch(queue.pop());
    };
    // Insert IFRAME element to HEAD, and set its src attribute to api host.
    var head = document.documentElement.firstChild;
    iframe.src = apihost + '/proxy.html';
    head.insertBefore(iframe, head.firstChild);
    // Define the `launch` method, it's used to send a HTTP request by proxy.
    var launch = this.launch = function(args){
      // Push `args` to queue and return, if `proxy` has not been initialized yet.
      if(!proxy) return void queue.push(args);
      // Otherwise, send the request to proxy page.
      // IE8 is don't support automatically stringify, so we need manually stringify.
      proxy.postMessage(JSON.stringify({
        method: args.method,
        uri: args.uri,
        headers: args.headers,
        data: args.data,
        // JSON can't support function type, push to global heap, and use its index as id. 
        id: heap.push(args.callback) - 1
      }), apihost);
    };
  };
  // Install `message` event for current `window` object.
  void (function() {
    // Add event listener and considered compatibility of IE8.
    window.addEventListener
      ? addEventListener('message', this)
      : attachEvent('onmessage', this);
  }).call(function(message) {
    // Here is the `message` event handle function.
    // The raw data are always JSON string, parse it as a JSON.
    var data = JSON.parse(message.data);
    // Extract the id field, it's a index of global heap.
    var callback = heap[data.id];
    // Delete the id field and clear the callback ref from heap.
    heap[data.id] = void delete data.id;
    // Call it, if it's a function.
    if(typeof callback == 'function') callback(data);
  });
  // Install some shortcut methods to its prototype.
  void function(){
    // RESTful major 4 methods. 
    var methods = ['get', 'post', 'put', 'delete'];
    // Through the methods and make closure one by one.
    for(var i = 0; i < methods.length; i++) void function(method) {
      APIProxy.prototype[method] = function(uri, data, callback) {
        // The `data` is a optional argument, make function overload.
        if(typeof data == 'function') callback = data, data = null;
        // Pack the arguments, and redirect to `launch` method.
        this.launch({
          method: method,
          uri: uri,
          data: data,
          callback: callback
        });
      };
    }(methods[i]);
  }();
}();

