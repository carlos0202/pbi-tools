import { app, BrowserWindow } from 'electron';

app.commandLine.appendSwitch('ignore-certificate-errors');

console.log('initiating overdrive...');

const createWindow = () => {
    console.log('creating browser window...')
    const win = new BrowserWindow({
      width: 1024,
      height: 768,
      webPreferences: {
          plugins: true,
          nodeIntegration: false,
          webSecurity: false,
          allowDisplayingInsecureContent: true,
          allowRunningInsecureContent: true
      }
    })
  
    console.log('loading index.html file...')
    win.loadFile('../index.html')
  }

  app.whenReady().then(() => {
    createWindow()
    console.log('app sucessfully loaded...')
  })