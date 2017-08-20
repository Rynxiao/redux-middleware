function dispatch(action) {
	action();
	return action;
}

function middleware1(dispatch) {
	return function(action) {
		console.log('middleware 1');
		var result = dispatch(action);
		console.log('after middleware 1');
		return result;
	}
} 

function middleware2(dispatch) {
	return function(action) {
		console.log('middleware 2');
		var result = dispatch(action);
		console.log('after middleware 2');
		return result;
	}
}

function middleware3(dispatch) {
	return function(action) {
		console.log('middleware 3');
		var result = dispatch(action);
		console.log('after middleware 3');
		return result;
	}
}

function compose(middlewares) {
	return middlewares.reduce(function(a, b) {
		return function(args) {
			return a(b(args));
		}
	});
}

var middlewares = [middleware1, middleware2, middleware3];
var afterDispatch = compose(middlewares)(dispatch);
afterDispatch(function() {
	console.log('action');
});