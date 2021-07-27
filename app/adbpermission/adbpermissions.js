import { EventBus } from "../../js/eventbus.js";
import { Control } from "../control.js";
import { Models, Model } from "../model.js";
import { UtilDOM } from "../utildom.js";
export class ADBPermissions extends Models {
    constructor(permissionsFromSystem, items = [
        {prettyName: "Write Secure Settings", isShell:true,isPmGrant:true,permission:"android.permission.WRITE_SECURE_SETTINGS",usedFor:"The <b>Custom Setting</b> action and some other specific setting actions."},
        {prettyName: "Read System Logs", isShell:true,isPmGrant:true,permission:"android.permission.READ_LOGS",usedFor:"The <b>Logcat Entry</b> event and on devices with Android 10+ to read the device's clipboard."},
        {prettyName: "Capture Screen", isShell:true,isPmGrant:false,permission:"PROJECT_MEDIA",usedFor:"Taking screenshots and recording the screen without having the Android system prompting you to allow it every time."}
    ]) {
        super(items.map(item=>{
            const fromSystem = permissionsFromSystem.find(permission => permission.permission == item.permission);
            if(!fromSystem) return item;

            item.granted = fromSystem.granted;
            return item;
        }));
    }
    get modelClass() {
        return ADBPermission;
    }
}
export class ADBPermission extends Model {
    constructor(args = { prettyName, isShell, isPmGrant, permission }) {
        super(args);
        this.prettyName = args.prettyName;
        this.isShell = args.isShell;
        this.isPmGrant = args.isPmGrant;
        this.permission = args.permission;
        this.usedFor = args.usedFor;
    }

    getCommand(grant){
        let command = this.isShell ? "shell" : "";
        command += this.isPmGrant ? ` pm ${grant ? "grant" : "revoke"}` : " appops set";
        command += ` net.dinglisch.android.taskerm ${this.permission}`;
        if(!this.isPmGrant){
            command += " " + (grant ? "allow" : "deny");
        }
        return command;
    }
}



export class ControlADBPermissions extends Control {
    /**
     * 
     * @param {ADBPermissions} adbPermissions 
     */
    constructor(adbPermissions) {
        super();
        this.adbPermissions = adbPermissions;
    }
    get html() {
        return `
        <div>
        <h4>Permissions</h4>
            <div id="adbPermissions">
            </div>
        </div>`;
    }
    get css() {
        return `
        #adbPermissions{
            display: flex;
            flex-direction:column;
            width: 98%;
        }
        .adbPermission{
            display: flex;
            align-items: center;
            justify-items: center;
            width: 100%;
            background: #dbdbdb;
            margin: 8px;
            padding: 4px;
        }
        .adbPermissionInfo{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
        }
        .adbPermissionName{
            font-size: 150%;
            font-weight: bold;
        }
        .adbPermissionCode{
            padding: 4px;
            font-size: 70%;
        }
        .adbPermissionUsedFor{
            padding-top: 8px;
        }
        .adbPermissionGrantRevoke{
            display: flex;
            align-items: center;
            justify-content: center;
            color:white;
            cursor: pointer;
            background-color:red;
            height: 100px;
            margin: 8px;
            padding: 8px;
            min-width: 200px;
        }
        .adbPermissionGrantRevoke.granted{
            background-color:green;
        }
        `;
    }
    async renderSpecific(root) {
        this.elementADBPermissions = await this.$("#adbPermissions");

        this.controls = await this.renderList(this.elementADBPermissions, this.adbPermissions, ControlADBPermission);
    }
}
export class ControlADBPermission extends Control {
    /**
     * 
     * @param {ADBPermission} adbPermission 
     */
    constructor(adbPermission) {
        super();
        this.adbPermission = adbPermission;
    }
    get html() {
        return `
        <div class="adbPermission">
            <span class="adbPermissionInfo">            
                <span class="adbPermissionName"></span>
                <span class="adbPermissionCode"></span>
                <span class="adbPermissionUsedFor"></span>
            </span>
            <span class="adbPermissionGrantRevoke">
                <span class="adbPermissionGrantRevokeContent"></span>
            </span>
        </div>`;
    }
    async renderSpecific(root) {
        this.elementADBPermission = root;
        this.elementADBPermissionName = await this.$(".adbPermissionName");
        this.elementADBPermissionCode = await this.$(".adbPermissionCode");
        this.elementADBPermissionUsedFor = await this.$(".adbPermissionUsedFor");
        this.elementADBPermissionGrantRevoke = await this.$(".adbPermissionGrantRevoke");
        this.elementADBPermissionGrantRevokeContent = await this.$(".adbPermissionGrantRevokeContent");

        this.elementADBPermissionName.innerHTML = this.adbPermission.prettyName;
        this.elementADBPermissionCode.innerHTML = `(${this.adbPermission.permission})`;
        this.elementADBPermissionUsedFor.innerHTML = `<b>Used for</b>: ${this.adbPermission.usedFor}`;
        
        const granted = this.granted;
        UtilDOM.addOrRemoveClass(this.elementADBPermissionGrantRevoke,granted,"granted");
        this.elementADBPermissionGrantRevokeContent.innerHTML = granted ? "Granted (click to revoke)" : "Revoked (click to grant)"

        this.elementADBPermissionGrantRevoke.onclick = async () => {
            const adbPermission = this.adbPermission;
            const grant = !this.granted;
            await EventBus.post(new RequestGrantRevokePermission({adbPermission,grant}));
        }

    }
    get granted(){
        return this.adbPermission.granted;
    }
}
class RequestGrantRevokePermission{
    constructor({adbPermission, grant}){
        this.adbPermission = adbPermission;
        this.grant = grant;
    }
}