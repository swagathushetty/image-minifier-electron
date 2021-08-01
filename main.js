const path=require('path')
const os=require('os')
const {app,BrowserWindow,Menu,globalShortcut, ipcMain,shell}=require('electron')
//app->manages lifecycle of app
//BrowserWindow->used to create desktop windows
const imagemin=require('imagemin')
const imageminMozjpeg=require('imagemin-mozjpeg')
const imageminPngquant=require('imagemin-pngquant')
const slash=require('slash')
const log=require('electron-log')


//set env
process.env.NODE_ENV='production'
const isDev= process.env.NODE_ENV!=='production' ? true:false

//detect platform
//mac=darwin windows=win32
const isMac=process.platform==='darwin' ?true:false

let mainWindow
let aboutWindow

function createMainWindow(){
   mainWindow=new BrowserWindow({
      title:'ImageShrink',
      width:500,
      height:600,
      icon:`${__dirname}/assets/icons/Icon_256x256.png`,
      resizable:isDev,
      backgroundColor:'white',
      webPreferences:{
        nodeIntegration:true,
        contextIsolation: false
      }
  })

  if(isDev){
    mainWindow.webContents.openDevTools()
  }

  mainWindow.loadURL(`file://${__dirname}/app/index.html`)
}

function createAboutWindow(){
    aboutWindow=new BrowserWindow({
       title:'About ImageShrink',
       width:300,
       height:300,
       icon:`${__dirname}/assets/icons/Icon_256x256.png`,
       resizable:false,
       backgroundColor:'white'
   })
 
   aboutWindow.loadURL(`file://${__dirname}/app/about.html`)
 }

const menu = [
    ...(isMac ? [
        { label: app.name,submenu:[
            {
                label:"About",
                click:createAboutWindow
              }] 
     }] : []),
    {
      role: 'fileMenu',
    },
    ...(!isMac ? [
        {
            label:"Help",
            submenu:[
                {
                    label:'About',
                    click:createAboutWindow

                }
            ]
          }
    ]:[]),
    ...(isDev
      ? [
          {
            label: 'Developer',
            submenu: [
              { role: 'reload' },
              { role: 'forcereload' },
              { type: 'separator' },
              { role: 'toggledevtools' },
            ],
          },
        ]
      : []),
  ];

// const menu=[
//     ...(isMac ? [{role:'appMenu'}]:[]),
//     {
//         role:'fileMenu', //this does same thing as the code belows

//         // label:'File',
//         // submenu:[
//         //     {
//         //         label:'Quit',
//         //         // accelerator:isMac ? 'Command+W':"Ctrl+W",
//         //         accelerator:"CommandOrCtrl+W", //keyboard shortcut.same as above
//         //         click:()=>app.quit()
//         //     }
//         // ]
//     },
//     {
//         ...(isDev ? [
//             {
//                 label:"Developer",
//                 submenu:[
//                     {role:'reload'},
//                     {role:'forcereload'},
//                     {role:'separator'},
//                     {role:'toggledevtools'},
                    
                    

//                 ]
//             }
//         ]:[])
//     }
// ]

if(isMac){
    menu.unshift({role:"appMenu"})
}


ipcMain.on('image:minimize',(e,options)=>{
  // console.log(options) //{ imgPath: 'C:\\Users\\shett\\Downloads\\Untitled.png', quality: '50' }

  options.dest=path.join(os.homedir(),'imageShrink')
  shrinkImage(options)
})

async function shrinkImage({imgPath,quality,dest}){
  try {
    const pngQuality=quality/100
    const files=await imagemin([slash(imgPath)],{
      destination:dest,
      plugins:[
        imageminMozjpeg({quality}),
        imageminPngquant({
          quality:[pngQuality,pngQuality]
        })
      ]
    })
    console.log(files)
    log.info(files) //stored in appData/roaming
    shell.openPath(dest)

    mainWindow.webContents.send('image:done')
  } catch (error) {
    console.log(error)
    log.error(err)
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (!isMac) app.quit()
})


app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})

app.on('ready',()=>{
    createMainWindow()

    const mainMenu=Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    // globalShortcut.register('CmdOrCtrl+R',()=>mainWindow.reload())
    // globalShortcut.register(isMac ? 'Command+Alt+I':'Ctrl+Shift+I',()=>mainWindow.toggleDevTools())


    //deleting the variable
    //saving memory
    mainWindow.on('closed',()=>mainWindow=null)
})