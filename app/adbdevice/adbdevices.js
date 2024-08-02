import { EventBus } from "../../js/eventbus.js";
import { Control } from "../control.js";
import { Models, Model } from "../model.js";
import { UtilDOM } from "../utildom.js";
import { ServerEventBus } from "../app.js";
import { ResponseRunCommandLineCommand } from "../app.js";
export class ADBDevices extends Models {
    constructor(items) {
        super(items);
    }
    get modelClass() {
        return ADBDevice;
    }
}
export class ADBDevice extends Model {
    constructor(args = { id, model, device }) {
        super(args);
        this.id = args.id;
        this.model = args.model;
        this.device = args.device;
    }
}



export class ControlADBDevices extends Control {
    /**
     * 
     * @param {ADBDevices} adbDevices 
     */
    constructor(adbDevices = new ADBDevices(), androidApp) {
        super();
        this.adbDevices = adbDevices;
        this.androidApp = androidApp;
        EventBus.register(this);
    }
    get html() {
        return `
        <div class="adbDevicesRoot">        
            <div id="adbDevicesReload">
                <b>Reload Devices/Permissions</b>
            </div>
            <div class="extraOptions">
                <div id="taskerAdbWifiRoot">
                    <div>Enable ADB Wifi in Tasker with port</div>
                    <input type="text" value="5555" id="inputAdbWifiPort"></input>
                    <input type="button" value="Confirm" id="buttonEnableAdbWifi"></input>
                </div>
                <div id="taskerInstallTaskerSettingsRoot">
                    <div>Install the latest version of Tasker Settings</div>
                    <input type="button" value="Confirm" id="buttonInstallTaskerSettings"></input>
                </div>
            </div>
            <div id="deviceListWrapper">
                <h4 id="elementADBDevicesTitle">Select Your Device Below</h4>
                <div id="instructionsToConnectDevice" class="hidden">
                </div>
                <div id="adbDevices">
                </div>
            </div>    
        </div>`;
    }
    get css() {
        return `
        #adbDevicesRoot{
            display: flex;
            flex-direction: column;
        }
        #adbDevices{
            display: flex;
        }
        #adbDevicesReload{
            padding:8px;
            border: 1px solid #808080c7;
            cursor: pointer;
            display:flex;
            justify-content: center;
            align-items: center;
        }
        .adbDevice{
            display: flex;
            align-items: center;
            border: 1px solid #808080c7;
            min-height:50px;
            min-width:50px;
            padding: 32px;
            cursor: pointer;
            font-weight: bold;
            margin: 16px;
        }
        .adbDevice.selected{
            background-color: blue;
            color: white;
        }
        .adbDeviceCodeName{
            padding: 4px;
        }
        .extraOptions{
            margin: 16px;
            font-weight: bold;
        }
        #taskerAdbWifiRoot{
        }
        `;
    }
    async renderSpecific(root) {
        this.elementDeviceListWrapper = await this.$("#deviceListWrapper");
        this.elementADBDevices = await this.$("#adbDevices");
        this.elementADBDevicesReload = await this.$("#adbDevicesReload");
        this.elementADBDevicesTitle = await this.$("#elementADBDevicesTitle");
        this.elementInstructions = await this.$("#instructionsToConnectDevice");
        this.elementAdbWifi = await this.$("#taskerAdbWifiRoot");
        this.elementAdbWifiPort = await this.$("#inputAdbWifiPort");
        this.elementAdbWifiButton = await this.$("#buttonEnableAdbWifi");
        this.elementInstallTaskerSettingsButton = await this.$("#buttonInstallTaskerSettings");

        this.controls = await this.renderList(this.elementADBDevices, this.adbDevices, ControlADBDevice);
        this.elementADBDevicesReload.onclick = async () => {
            EventBus.post(new RequestReloadDevices());
        }
        if (!this.adbDevices || this.adbDevices.length == 0) {
            UtilDOM.show(this.elementInstructions);
            UtilDOM.hide(this.elementAdbWifi);
            this.elementADBDevicesTitle.innerHTML = "No devices detected";
            this.elementInstructions.innerHTML = `
            <ol>
                <li>Make sure that <b>${this.androidApp.name}</b> is installed on your Android device</li>
                <li><b>Enable Developer Mode</b>: Go to Android Settings -&gt; About Phone and look for the <b>Build Number</b> option. Touch it multiple times until developer mode is enabled.</li>
                <li><b>Enable USB Debugging</b>: Go to Android Settings -&gt; and look for the <b>Developer Options</b> option. In there, enable the <b>USB debugging</b> option.</li>
                <li><b>(Optional) Enable addition developer permissions on some devices</b>: On some devices (mostly Xiaomi or Huawei) you need to enable the option <b>Disable permission Monitoring</b> or <b>USB Debugging (Security Settings)</b> under the <b>Developer Options</b> mentioned above</li>
                <li><b>Connect device to PC</b>: Connect your device to a PC and look on your phone. A prompt should show up asking you to allow your phone to be debugged by your PC. Accept this.</li>
                <li><b>Reload</b>: Press the Reload button above</li>
                <li><b>Grant Permissions</b>: Use the buttons that should now appear to grant <b>${this.androidApp.name}</b> the permissions you want!</li>
            </ol>`;

        } else {
            UtilDOM.hide(this.elementInstructions);
            UtilDOM.showOrHide(this.elementAdbWifi, this.androidApp.packageName == "net.dinglisch.android.taskerm");
            this.elementAdbWifiButton.onclick = async () => {
                const port = this.elementAdbWifiPort.value;
                EventBus.post(new RequestRunAdbCommand(`tcpip ${port}`));
            }
            this.elementInstallTaskerSettingsButton.onclick = async () => {
                this.elementInstallTaskerSettingsButton.disabled = true;
                this.elementInstallTaskerSettingsButton.value = "Installing..."
                const result = await ServerEventBus.postAndWaitForResponse(new RequestInstallTaskerSettings(),ResponseRunCommandLineCommand,10000);                
                alert(result.error ?? "Installed Latest Tasker Settings!");                
                this.elementInstallTaskerSettingsButton.value = "Confirm"
                this.elementInstallTaskerSettingsButton.disabled = false;
            }
        }
        if (this.adbDevices && this.adbDevices.length == 1) {
            this.elementADBDevicesTitle.innerHTML = "";
        };

        if (this.controls.length == 0) return;

        this.controls[0].selected = true;

    }
    async toggleShow() {
        UtilDOM.toggleShow(this.elementADBDevices)
    }
    async onUnSelectDevices() {
        this.controls.forEach(control => {
            control.selected = false;
        });
    }
    get selectedDeviceControl() {
        if (!this.controls || this.controls.length == 0) return null;

        return this.controls.find(control => control.selected);
    }
}
export class ControlADBDevice extends Control {
    /**
     * 
     * @param {ADBDevice} adbDevice 
     */
    constructor(adbDevice) {
        super();
        this.adbDevice = adbDevice;
    }
    get html() {
        return `
        <div class="adbDevice">
            <span class="adbDeviceModel"></span>
            <span class="adbDeviceCodeName"></span>
        </div>`;
    }
    async renderSpecific(root) {
        this.elementADBDevice = root;
        this.elementADBDeviceModel = await this.$(".adbDeviceModel");
        this.elementADBDeviceCodeName = await this.$(".adbDeviceCodeName");

        this.elementADBDeviceModel.innerHTML = this.adbDevice.model;
        this.elementADBDeviceCodeName.innerHTML = `(${this.adbDevice.device})`;

        this.elementADBDevice.onclick = async () => {
            await EventBus.post(new UnSelectDevices());
            this.selected = true;
            await EventBus.post(new SelectedDevice());
        }
    }
    get selected() {
        return UtilDOM.hasClass(this.elementADBDevice, "selected");
    }
    set selected(value) {
        UtilDOM.addOrRemoveClass(this.elementADBDevice, value, "selected");
    }
}
class RequestReloadDevices { }
class SelectedDevice { }

class UnSelectDevices {
}

class RequestRunAdbCommand {
    constructor(command) {
        this.command = command;
    }
}

class RequestInstallTaskerSettings {
    constructor() {
    }
}