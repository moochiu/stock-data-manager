const { app, BrowserWindow } = require('electron')

console.log('Testing Electron import...')
console.log('app:', app)
console.log('BrowserWindow:', BrowserWindow)

if (!app) {
  console.error('ERROR: app is undefined!')
  process.exit(1)
}

app.whenReady().then(() => {
  console.log('SUCCESS: Electron app is ready!')
  process.exit(0)
}).catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
