const { app, BrowserWindow } = require('electron');
const {spawn} = require('child_process');
const path = require('path');
const electron = require('electron');
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

var mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 520,
    height: 400,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      devTools: false

    },
    resizable: false
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('ready', function() {
  createWindow()
  console.log(mainWindow)
  mainWindow.on('close', function() {
    app.quit();
  })
});

// Logic for triggering formatting

let inputdir;
let outputdir;

let duplicatetoggle = false
let sourcetoggle = false

ipcMain.on('toggleDuplicate', (event, arg) => {
  duplicatetoggle = arg
})

ipcMain.on('toggleSource', (event, arg) => {
  sourcetoggle = arg
})

ipcMain.on('selectInputDirectory', (event, arg) => {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }).then((e) => {
    if (!e.canceled) {
      inputdir = e.filePaths[0]
      event.reply('selectInputDirectoryReply', inputdir)
    }
  })
})

ipcMain.on('selectOutputDirectory', (event, arg) => {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }).then((e) => {
    if (!e.canceled) {
      outputdir = e.filePaths[0]
      event.reply('selectOutputDirectoryReply', outputdir)
    }
  })
})

ipcMain.on('startFormatting', (event, arg) => {
  if (sourcetoggle) {
    outputdir = inputdir
  }
  let mode = "pending"
  let duplicates = []
  let errors = []
  var dataToSend;
  const python = spawn(path.join(__dirname, '../formatter/dist/run/run'), [inputdir, outputdir, duplicatetoggle]);
  python.stderr.on('data', function (data) {
    dataToSend = data.toString();
    let chunks = dataToSend.split("<<<")
    errors.push(chunks[0])
  })
  python.stdout.on('data', function (data) {
    dataToSend = data.toString();
    let chunks = dataToSend.split("<<<")
    for (let i = 0; i < chunks.length; i++) {
      let dataParsed = chunks[i].split(">>>")
      if (dataParsed[0] === "FileCount") {
        mainWindow.webContents.send('fileCount', dataParsed[1]);
      }
      if (dataParsed[0] === "Scanned") {
        mode = "scanning"
        try {
          mainWindow.webContents.send('scanFile', {'count': dataParsed[1], 'file': dataParsed[2]});
        } catch(err) {
          console.log(err)
        }
      }
      if (dataParsed[0] === "Processed") {
        mode = "processed"
        try {
          mainWindow.webContents.send('processFile', {'count': dataParsed[1], 'file': dataParsed[2]});
        } catch(err) {
          console.log(err)
        }
      }
      if (dataParsed[0] === "Duplicate") {
        duplicates.push({"removed": dataParsed[1], "duplicate": dataParsed[2]})
      }
      if (dataParsed[0] === "Done") {
        mainWindow.webContents.send('completedFormat', {'duplicates': duplicates, 'errors': errors});
      }
    }
  });
  ipcMain.on('cancelFormatting', (event, arg) => {
    python.stdin.pause()
    python.kill()
  })
  mainWindow.on('close', function() {
    python.stdin.pause()
    python.kill()
  })
})
