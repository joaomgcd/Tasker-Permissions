const { ipcMain ,app,nativeImage,BrowserWindow,Tray,Menu, MenuItem,nativeTheme,screen } = require('electron')
const {EventBus} = require("../js/eventbus.js")
import { CommandLine } from './commandline.js';

import { Util } from '../js/util.js';

const os = require('os');
const path = require('path')
const appIcon = nativeImage.createFromDataURL(`data:image/png;base64,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`);
export class Server{
    constructor(){
    }
      
    get isWindows(){
        return os.platform() == "win32";
    }
    get isMac(){
        return os.platform() == "darwin";
    }
    get isLinux(){
        return !this.isWindows && !this.isMac;
    }
    get systemTypeString(){
        if(this.isWindows) return "windows";
        if(this.isMac) return "mac";
        if(this.isLinux) return "linux";
    }
    get execFolder(){
        return this.getCurrentAppPath();
    }
    async createWindow() {
        const args = {
            icon: appIcon,   
            webPreferences: {
              contextIsolation: true,
              enableRemoteModule: false,
              preload: path.join(__dirname, '../preload.js')
            },
            bounds:{width: 800, height: 800}
        }
        const mainWindow = new BrowserWindow(args);
        mainWindow.setMenuBarVisibility(false);
        
        mainWindow.loadFile('index.html')
      
        // Open the DevTools.
        // mainWindow.webContents.toggleDevTools()
        this.window = mainWindow;
        return mainWindow;
    }
    async load(){   
        await this.createWindow();
        EventBus.register(this);
        ipcMain.on("eventbus",async (event,{data,className}) => {
            // console.log("Sending to eventbus from web page",data,className)
            await EventBus.post(data,className);
        });
        return this.window;
        // const path = require('path');
    }
    async sendToPageEventBus(object){
        await this.window.webContents.send('eventbus', {data:object,className:object.constructor.name});
    }
    onRequestTest(){
        console.log("Request test");
        this.sendToPageEventBus(new ResponseTest());
    }
    getCurrentAppPath(){
        return require('electron').app.getAppPath().replaceAll("\\","/");
    }
    async logConsole(log,args){
        console.log(log,args);

        this.sendToPageEventBus(new RequestConsoleLog(log,args));
    }
    async onRequestRunCommandLineCommand({command,args,prependCurrentPath}){
        if(!command){
            this.logConsole("Won't run empty command line command");
            return;
        }
        command = command.replace("bin/",`bin/${this.systemTypeString}/`);
        if(command.includes("adb.exe") && (this.isMac || this.isLinux)){
            command = command.replace(".exe","");
            const chmod = `chmod 755 ${this.execFolder}/bin/${this.systemTypeString}/adb`;
            this.logConsole("Running chmod",chmod);
            const resultChmod = await CommandLine.run(chmod);
            this.logConsole("chmod result",resultChmod);
        }
        if(prependCurrentPath){
            // command = (await this.getCurrentAppPath()) + "/" + command;
            command = this.execFolder + "/" + command;
        }
        command = command.replaceAll("resources/app.asar/","").replaceAll("Resources/app.asar/","");
        this.logConsole("Running command line Server",command,args);
        try{
            const result = await CommandLine.run(command,args);
            this.logConsole("Command line result",result);
            await this.sendToPageEventBus(new ResponseRunCommandLineCommand(result));
        }catch(error){
            this.logConsole("Command line error",error);
            error = JSON.stringify(error);
            error = JSON.parse(error);
            await this.sendToPageEventBus(new ResponseRunCommandLineCommand(error));
        }
    }
    async onRequestToggleDevOptions(){
        this.window.webContents.toggleDevTools()
    }
}

class ResponseRunCommandLineCommand{
    constructor(result){
        Object.assign(this,result);
    }
}

class ResponseTest{}
class RequestConsoleLog{
    constructor(log,args){
        this.log = log;
        this.args = args;
    }
}