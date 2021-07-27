import { EventBus } from "../js/eventbus.js";
import { ADBDevice, ADBDevices, ControlADBDevices } from "./adbdevice/adbdevices.js";
import { ADBPermissions, ControlADBPermissions } from "./adbpermission/adbpermissions.js";
import { Control } from "./control.js";
export class App extends Control {
    constructor() {
        super();
    }
    getHtmlFile(){
        return "./app/app.html";
    }
    async getCssFile(){
        return "./app/app.css";
    }
    async render(){
        const result = await super.render();
        console.log("Rendering...");
        EventBus.register(this);
        window.api.receive("eventbus", async ({data,className}) => {
           await EventBus.post(data,className);
        });
        // ServerEventBus.post(new RequestTest());

        await this.renderAll();
        return result;
    }
    async renderAll(){
        await this.renderDevices();
        await this.renderPermissions();  
    }
    async onResponseTest(){
        console.log("Response test");
    }
    async renderDevices(){
        const devicesRoot = await this.$("#adbDevicesRoot");

        const adbDevices = await this.adbDevices;

        this.controlADBDevices = new ControlADBDevices(adbDevices);
        this.renderInto(this.controlADBDevices,devicesRoot);
    }
    async onSelectedDevice(){
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
        this.renderInto(this.controlADBPermissions,elementPermissionsRoot);
    }
    async onRequestGrantRevokePermission(request){
        console.log("Granting/revoking permission with request", request);
        const result = await this.runAdbCommand(request.adbPermission.getCommand(request.grant));
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
    async getAppOppsPermissionGranted(permission){
        const result = (await this.runAdbShellCommand(`appops get net.dinglisch.android.taskerm ${permission}`)).out;
        if(!result || !result.includes("allow")) return false;

        return true;
    }
    get adbPermissions(){
        return (async ()=>{
            const dump = await this.adbPermissionsDump;
            return new ADBPermissions(dump);
        })();
    }
    get adbPermissionsDump(){
        return (async ()=>{
            const rawResult = (await this.runAdbShellCommand("dumpsys package net.dinglisch.android.taskerm")).out;
            const permissionRelated = rawResult.split("\n").filter(line => line.includes(": granted="));
            const result = permissionRelated.map(permissionLine=>{
                const match = permissionLine.match(/([^:]+): granted=([^\r,]+)/);
                return {permission:match[1].trim(),granted:match[2] == "true" ? true: false};
            });
            const projectMediaPermission = "PROJECT_MEDIA";
            const projectMediaGranted = await this.getAppOppsPermissionGranted(projectMediaPermission);
            result.push({permission:projectMediaPermission,granted:projectMediaGranted});
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
}

class RequestRunCommandLineCommand{
    constructor(args = {command,args,prependCurrentPath}){
        Object.assign(this,args);
    }
}
class ResponseRunCommandLineCommand{}

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