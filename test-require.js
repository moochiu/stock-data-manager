const electron = require('electron')
console.log('electron:', electron)
console.log('typeof electron:', typeof electron)
console.log('electron keys:', Object.keys(electron || {}))
