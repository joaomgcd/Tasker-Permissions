import { EventBus } from "../js/eventbus.js";
import { ADBDevice, ADBDevices, ControlADBDevices } from "./adbdevice/adbdevices.js";
import { ADBPermissions, ControlADBPermissions } from "./adbpermission/adbpermissions.js";
import { AndroidApps, ControlAndroidApps } from "./androidapps/androidapps.js";
import { Control } from "./control.js";
import { UtilDOM } from "./utildom.js";
export class App extends Control {
    constructor() {
        super();
    }
    get html(){
        return `
        <div id="app">
            <div id="androidAppsRoot"></div>
            <div id="adbDevicesRoot"></div>
            <div id="adbPermissionsRoot"></div>
        </div>`;
    }
    get css(){
        return `
        html,body{
            margin: 0px;
        }
        .hidden{
            display: none;
        }
        `;
    }
    async render(){
        const result = await super.render();
        console.log("Rendering...");
        window.api.receive("eventbus", async ({data,className}) => {
           await EventBus.post(data,className);
        });
        // ServerEventBus.post(new RequestTest());

        window.oncontextmenu = () => ServerEventBus.post(new RequestToggleDevOptions());
        await this.renderAll();
        EventBus.register(this);
        return result;
    }
    async renderAll(){
        await this.renderAndroidApps();
        await this.renderDevices();
        await this.renderPermissions();  
    }
    async onResponseTest(){
        console.log("Response test");
    }
    async renderAndroidApps(){
        this.controlAndroidApps = new ControlAndroidApps();
        const androidAppsRoot = await this.$("#androidAppsRoot");
        await this.renderInto(this.controlAndroidApps,androidAppsRoot);
    }
    async renderDevices(){
        const devicesRoot = await this.$("#adbDevicesRoot");

        const adbDevices = await this.adbDevices;

        this.controlADBDevices = new ControlADBDevices(adbDevices, this.selectedAndroidApp);
        await this.renderInto(this.controlADBDevices,devicesRoot);
    }
    async onSelectedDevice(){
        await this.renderPermissions();
    }
    async onSelectedAndroidApp(){
        await this.renderDevices();
        await this.renderPermissions();
    }
    async renderPermissions(){
        const elementPermissionsRoot = await this.$("#adbPermissionsRoot");
        elementPermissionsRoot.innerHTML = "Loading permissions...";

        if(!this.selectedDeviceControl){
            elementPermissionsRoot.innerHTML = "";
    
            return;
        }
        const adbPermissions = await this.adbPermissions;
        console.log("Permissions dump",adbPermissions);

        this.controlADBPermissions = new ControlADBPermissions(adbPermissions)
        await this.renderInto(this.controlADBPermissions,elementPermissionsRoot);
    }
    async onRequestGrantRevokePermission(request){
        console.log("Granting/revoking permission with request", request);
        const command = await request.adbPermission.getCommand(request.grant);
        const result = await this.runAdbCommand(command);
        console.log("Grant result",result);

        const error = result.error;
        if(error){
            alert(`Error: ${error}`);
        }

        await this.renderPermissions();  
    }
    get adbDevices(){
        return (async ()=>{
            const rawResult = (await this.runAdbCommand("devices -l")).out;
            const startOfList = rawResult.substring(rawResult.indexOf("\n")+1);
            const split = startOfList.split("\n");
            return new ADBDevices(split.map(deviceRaw=>{
                const result = deviceRaw.replaceAll("\r","");
                const id = deviceRaw.substring(0,result.indexOf(" "));
                if(!id) return null;

                const model = result.match(/model:([^ ]+)/)[1];
                const device = result.match(/device:([^ ]+)/)[1];
                return new ADBDevice({id, model,device});
            }).filter(device=>device ? true : false));
        })();
    }    
    get selectedDeviceControl(){
        if(!this.controlADBDevices) return null;

        return this.controlADBDevices.selectedDeviceControl;
    }
    get selectedAndroidApp(){
        if(!this.controlAndroidApps) return null;

        return this.controlAndroidApps.selectedAndroidApp.androidApp;
    }
    async getAppOppsPermissionGranted(permission){
        const result = (await this.runAdbShellCommand(`appops get ${this.selectedAndroidApp.packageName} ${permission}`)).out;
        if(!result || !result.includes("allow")) return false;

        return true;
    }
    get adbPermissions(){
        return (async ()=>{
            const dump = await this.adbPermissionsDump;
            return new ADBPermissions(dump,this.selectedAndroidApp);
        })();
    }
    get adbPermissionsDump(){
        return (async ()=>{
            const rawResult = (await this.runAdbShellCommand(`dumpsys package ${this.selectedAndroidApp.packageName}`)).out;
            const permissionRelated = rawResult.split("\n").filter(line => line.includes(": granted="));
            const result = permissionRelated.map(permissionLine=>{
                const match = permissionLine.match(/([^:]+): granted=([^\r,]+)/);
                return {permission:match[1].trim(),granted:match[2] == "true" ? true: false};
            });
            const addAppOpsPermission = async permission => {             
                const granted = await this.getAppOppsPermissionGranted(permission);
                result.push({permission,granted});
            }
            await addAppOpsPermission("PROJECT_MEDIA");
            await addAppOpsPermission("SYSTEM_ALERT_WINDOW");
            return result;
        })();
    }
    async runAdbShellCommand(command){
        return await this.runAdbCommand(`shell "${command}"`);
    }
    async runAdbCommand(commandInput){
        let command = "bin/adb.exe";
        const selectedDevice = await this.selectedDeviceControl;
        if(selectedDevice){
            command += ` -s ${selectedDevice.adbDevice.id}`;
        }
        command += ` ${commandInput}`;
        return await this.runCommandLine(command,null,true);
    }
    async runCommandLine(command, args, prependCurrentPath){
        console.log("Running command line",command,args);
        const response = await ServerEventBus.postAndWaitForResponse(new RequestRunCommandLineCommand({command,args,prependCurrentPath}),ResponseRunCommandLineCommand,10000);
        console.log("Ran command line. Response:",response);
        return response;
    }
    async onRequestConsoleLog(log){
        console.log("Log from server",log);
    }
    async onRequestReloadDevices(){
        await this.renderAll();
    }
    async onRequestRunAdbCommand({command}){     
        console.log("onRequestRunAdbCommand", command);
        const result = await this.runAdbCommand(command);
        console.log("onRequestRunAdbCommand result", result);
        if(result.error){
            alert(result.error);
        }else{
            alert("Success!")
        }
    }
}

class RequestRunCommandLineCommand{
    constructor(args = {command,args,prependCurrentPath}){
        Object.assign(this,args);
    }
}
class ResponseRunCommandLineCommand{}

class RequestToggleDevOptions{}
export class ServerEventBus{
    static async post(object){
        try{
            await window.api.send('eventbus', {data:object,className:object.constructor.name});
        }catch{
            let data = {data:object,className:object.constructor.name};
            data = JSON.stringify(data);
            data = JSON.parse(data);
            await window.api.send('eventbus', data);
        }
    }
    static async postAndWaitForResponse(object,repsonseClzz,timeout){
        const responsePromise = EventBus.waitFor(repsonseClzz,timeout);
        ServerEventBus.post(object);
        return responsePromise;
    }
}

class RequestTest{}