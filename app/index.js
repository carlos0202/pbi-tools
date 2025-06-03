const { app, BrowserWindow } =  require('electron');

app.commandLine.appendSwitch('ignore-certificate-errors');

console.log('initiating overdrive...');

const createWindow = () => {
    console.log('creating browser window...')
    const win = new BrowserWindow({
      width: 1024,
      height: 768,
      webPreferences: {
          plugins: true,
          nodeIntegration: true,
      }
    })
  
    console.log('loading index.html file...')
    win.loadFile('views/index.html')
  }

  app.whenReady().then(() => {
    createWindow()
    console.log('app sucessfully loaded...')

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })