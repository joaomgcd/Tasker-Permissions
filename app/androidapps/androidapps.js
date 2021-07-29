import { EventBus } from "../../js/eventbus.js";
import { Control } from "../control.js";
import { Models, Model } from "../model.js";
import { UtilDOM } from "../utildom.js";
export class AndroidApps extends Models {
    constructor(items) {
        super(items);
    }
    get modelClass() {
        return AndroidApp;
    }
}
export class AndroidApp extends Model {
    constructor(args = { packageName, name, icon }) {
        super(args);
        this.packageName = args.packageName;
        this.name = args.name;
        this.icon = args.icon;
    }
}



export class ControlAndroidApps extends Control {
    /**
     * 
     * @param {AndroidApps} androidApps 
     */
    constructor(androidApps = new AndroidApps([
        {
            packageName:"net.dinglisch.android.taskerm",
            name:"Tasker",
            icon: `taskersmall.png`
        },{
            packageName:"com.joaomgcd.join",
            name:"Join",
            icon: `joinsmall.png`
        },{
            packageName:"com.joaomgcd.autoinput",
            name:"AutoInput",
            icon: `autoinputsmall.png`
        },{
            packageName:"com.joaomgcd.autowear",
            name:"AutoWear (Watch)",
            icon: `autowearsmall.png`
        }
    ])) {
        super();
        this.androidApps = androidApps;
        EventBus.register(this);
    }
    get html() {
        return `
        <div class="androidAppsRoot">        
            <div id="androidApps">
            </div>
        </div>`;
    }
    get css() {
        return `
        #androidAppsRoot{
            display: flex;
            flex-direction: column;
        }
        #androidApps{
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
        }
        .androidApp{
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            min-width: 160px;
        }
        .androidApp.selected{
            background-color: blue;
            color: white;
        }
        .androidAppName{
            font-weight: bold;
        }
        `;
    }
    async renderSpecific(root) {
        this.elementAndroidApps = await this.$("#androidApps");

        this.controls = await this.renderList(this.elementAndroidApps, this.androidApps, ControlAndroidApp);
    

        if(this.controls.length == 0) return;

        this.controls[0].selected = true;
        
    }
    async onUnSelectAndroidApps() {
        this.controls.forEach(control => {
            control.selected = false;
        });
    }
    get selectedAndroidApp(){
        if(!this.controls || this.controls.length == 0) return null;

        return this.controls.find(control=>control.selected);
    }
}
export class ControlAndroidApp extends Control {
    /**
     * 
     * @param {AndroidApp} androidApp 
     */
    constructor(androidApp) {
        super();
        this.androidApp = androidApp;
    }
    get html() {
        return `
        <div class="androidApp">
            <img class="androidAppIcon"></img>
            <span class="androidAppName"></span>
        </div>`;
    }
    async renderSpecific(root) {
        this.elementAndroidApp = root;
        this.elementAndroidAppName = await this.$(".androidAppName");
        this.elementAndroidAppIcon = await this.$(".androidAppIcon");

        this.elementAndroidAppName.innerHTML = this.androidApp.name;
        this.elementAndroidAppIcon.src = this.androidApp.icon;
        this.elementAndroidApp.onclick = async () => {
            await EventBus.post(new UnSelectAndroidApps());
            this.selected = true;
            await EventBus.post(new SelectedAndroidApp());
        }
    }
    get selected(){
        return UtilDOM.hasClass(this.elementAndroidApp,"selected");
    }
    set selected(value){
        UtilDOM.addOrRemoveClass(this.elementAndroidApp,value,"selected");
    }
}
class SelectedAndroidApp {}

class UnSelectAndroidApps {
}