import { EventBus } from "../../js/eventbus.js";
import { Control } from "../control.js";
import { Models, Model } from "../model.js";
import { UtilDOM } from "../utildom.js";
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
    constructor(adbDevices = new ADBDevices()) {
        super();
        this.adbDevices = adbDevices;
        EventBus.register(this);
    }
    get html() {
        return `
        <div class="adbDevicesRoot">        
            <div id="adbDevicesReload">
                Reload
            </div>
            <div id="deviceListWrapper">
                <h4 id="elementADBDevicesTitle">Select Your Device Below</h4>
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
        `;
    }
    async renderSpecific(root) {
        this.elementDeviceListWrapper = await this.$("#deviceListWrapper");
        this.elementADBDevices = await this.$("#adbDevices");
        this.elementADBDevicesReload = await this.$("#adbDevicesReload");
        this.elementADBDevicesTitle = await this.$("#elementADBDevicesTitle");

        this.controls = await this.renderList(this.elementADBDevices, this.adbDevices, ControlADBDevice);
        this.elementADBDevicesReload.onclick = async () => {
            EventBus.post(new RequestReloadDevices());
        }
        if(!this.adbDevices || this.adbDevices.length == 0){
            this.elementADBDevicesTitle.innerHTML = "No devices detected";
        };
        if(this.adbDevices && this.adbDevices.length == 1){
            this.elementADBDevicesTitle.innerHTML = "";
        };

        if(this.controls.length == 0) return;

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
    get selectedDeviceControl(){
        if(!this.controls || this.controls.length == 0) return null;

        return this.controls.find(control=>control.selected);
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
        }
    }
    get selected(){
        return UtilDOM.hasClass(this.elementADBDevice,"selected");
    }
    set selected(value){
        UtilDOM.addOrRemoveClass(this.elementADBDevice,value,"selected");
        if(value){
            EventBus.post(new SelectedDevice());
        }
    }
}
class RequestReloadDevices {}
class SelectedDevice {}

class UnSelectDevices {
}