class Emitter {
	constructor() {
		this._events = {}
	}

	on(e, fn) {
		
		this._events[e] = this._events[e] || []
		this._events[e].push(fn)
	}
		
	off(e, fn) {
		
		if( e in this._events === false  )	return
		this._events[e].splice(this._events[e].indexOf(fn), 1)
	}

	emit(e, ...args){
		
		if( e in this._events === false  )	return
		for(var i = 0; i < this._events[e].length; i++){
			const fn = this._events[e][i]
			fn.apply(this, args)
		}
	}
}

module.exports = Emitter
