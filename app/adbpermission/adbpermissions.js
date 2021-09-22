import { EventBus } from "../../js/eventbus.js";
import { Control } from "../control.js";
import { Models, Model } from "../model.js";
import { UtilDOM } from "../utildom.js";
export class ADBPermissions extends Models {
    constructor(permissionsFromSystem, androidApp, items = [
        {
            prettyName: "Draw Over Other Apps", isShell: true, isPmGrant: false, canBeGrantedInSystem: true, permission: "SYSTEM_ALERT_WINDOW",
            usedFor: {
                "net.dinglisch.android.taskerm": "To launch itself from the background in various situations and to draw scenes over other apps.<br/><b>THIS IS MANDATORY FOR TASKER</b>",
                "com.joaomgcd.join": "To read the clipboard, along with the <b>Write Secure Settings</b> and <b>Draw Over Other Apps</b> permissions, to open links from the background and to draw the clipboard bubbles"
            }
        },
        {
            prettyName: "Write Secure Settings", isShell: true, isPmGrant: true, permission: "android.permission.WRITE_SECURE_SETTINGS",
            usedFor: {
                "net.dinglisch.android.taskerm": "The <b>Custom Setting</b> action and some other specific setting actions.",
                "com.joaomgcd.join": "To read the clipboard, along with the <b>Read System Logs</b> and <b>Draw Over Other Apps</b> permissions",
                "com.joaomgcd.autoinput": "Automatically starting and stopping the AutoInput accessibility service.",
                "com.joaomgcd.autowear": "Setting some special settings on your watch that only work with this permission.",
                "com.joaomgcd.autotools": "The 'Secure Settings' action."
            }
        },
        {
            prettyName: "Read System Logs", isShell: true, isPmGrant: true, permission: "android.permission.READ_LOGS",
            usedFor: {
                "net.dinglisch.android.taskerm": "The <b>Logcat Entry</b> event and on devices with Android 10+ to read the device's clipboard.",
                "com.joaomgcd.join": "To read the clipboard, along with the <b>Write Secure Settings</b> and <b>Draw Over Other Apps</b> permissions"
            }
        },
        {
            prettyName: "Running Services", isShell: true, isPmGrant: true, permission: "android.permission.DUMP",
            usedFor: {
                "net.dinglisch.android.taskerm": "Checking what services are running on your device."
            }
        },
        {
            prettyName: "Long-click Volume Buttons", isShell: true, isPmGrant: true, permission: "android.permission.SET_VOLUME_KEY_LONG_PRESS_LISTENER",
            usedFor: {
                "net.dinglisch.android.taskerm": "Checking when you long press the volume keys on your device."
            }
        },
        {
            prettyName: "Media Buttons", isShell: true, isPmGrant: true, permission: "android.permission.SET_MEDIA_KEY_LISTENER",
            usedFor: {
                "net.dinglisch.android.taskerm": "Checking when you press media keys on your device."
            }
        },
        {
            prettyName: "Capture Screen", isShell: true, isPmGrant: false, permission: "PROJECT_MEDIA",
            usedFor: {
                "net.dinglisch.android.taskerm": "Taking screenshots and recording the screen without having the Android system prompting you to allow it every time.",
                "com.joaomgcd.join": "Taking remote screenshots and screen recordings without having the Android system prompting you to allow it every time.",
                "com.joaomgcd.autoinput": "Taking screenshots and recording the screen without having the Android system prompting you to allow it every time."
            }
        },
        {
            prettyName: "Application Usage Stats", isShell: true, isPmGrant: false, canBeGrantedInSystem: true, permission: "GET_USAGE_STATS",
            usedFor: {
                "net.dinglisch.android.taskerm": "Getting app info, checking which app is opened and other app activity related stuff."
            }
        },
        {
            prettyName: "Write Settings", isShell: true, isPmGrant: false, canBeGrantedInSystem: true, permission: "WRITE_SETTINGS",
            usedFor: {
                "net.dinglisch.android.taskerm": "Changing various system settings."
            }
        },
        {
            prettyName: "Change System Locale", isShell: true, isPmGrant: true, permission: "android.permission.CHANGE_CONFIGURATION",
            usedFor: {
                "net.dinglisch.android.taskerm": "Changing the system's current locale"
            }
        }/*,
        {
            prettyName: "Device Admin", isShell: true, isPmGrant: true, permission: "android.permission.BIND_DEVICE_ADMIN",
            usedFor: {
                "net.dinglisch.android.taskerm": "Locking screen with <b>System Lock</b> action and other admin related actions"
            }
        },
        {
            prettyName: "Notification Interception", isShell: true, isPmGrant: true, permission: "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
            usedFor: {
                "net.dinglisch.android.taskerm": "Intercepting notifications with the <b>Notification</b> event",
                "com.joaomgcd.join": "Intercepting notifications and syncing them with other devices"
            }
        }*/,
        {
            prettyName: "Package Usage Stats", isShell: true, isPmGrant: true, permission: "android.permission.PACKAGE_USAGE_STATS",
            usedFor: {
                "net.dinglisch.android.taskerm": "On some devices this is needed to get the <b>Services</b> option to work with the <b>App</b> context in Tasker."
            }
        }/*,
        {
            prettyName: "Accessibility Service", isShell: true, isPmGrant: true, permission: "android.permission.BIND_ACCESSIBILITY_SERVICE",
            usedFor: {
                "net.dinglisch.android.taskerm": "Detect app launches and other accessibility related events/actions."
            }
        }*/
    ]) {
        super(Number.isInteger(permissionsFromSystem) ? permissionsFromSystem : items.map(item => {
            const forAndroidApp = item.usedFor[androidApp.packageName];
            if (!forAndroidApp) return;

            item.usedFor = forAndroidApp;
            item.androidApp = androidApp;
            const fromSystem = permissionsFromSystem.find(permission => permission.permission == item.permission);
            if (!fromSystem) return item;

            item.granted = fromSystem.granted;
            return item;
        }).filter(item => item ? true : false));
    }
    get modelClass() {
        return ADBPermission;
    }
    get allGranted(){
        return this.find(permission => !permission.granted) ? false : true;
    }
}
export class ADBPermission extends Model {
    constructor(args = { prettyName, isShell, isPmGrant, permission, androidApp }) {
        super(args);
        this.prettyName = args.prettyName;
        this.isShell = args.isShell;
        this.isPmGrant = args.isPmGrant;
        this.permission = args.permission;
        this.usedFor = args.usedFor;
        this.androidApp = args.androidApp;
    }

    async getCommand(grant) {
        const packageName = this.androidApp.packageName;
        let command = this.isShell ? "shell" : "";
        command += ` "`;
        command += this.isPmGrant ? `pm ${grant ? "grant" : "revoke"}` : "appops set";
        command += ` ${packageName} ${this.permission}`;
        if (!this.isPmGrant) {
            command += " " + (grant ? "allow" : "deny");
        }
        if(this.permission == "android.permission.READ_LOGS" && grant){
            alert(`Granting the Read Logs permission will restart ${this.androidApp.name} on your Android device.`);
            command += ` & am force-stop ${packageName}`;
        }
        command += `"`;
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
            <span class="adbPermissionGrantRevoke">
                <span class="adbPermissionGrantRevokeContent"></span>
            </span>
            <div id="adbPermissions">
            </div>
        </div>`;
    }
    get css() {
        return `
        #adbPermissions{
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            width: 98%;
        }
        .adbPermission{
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-items: center;
            background: #dbdbdb;
            margin: 8px;
            padding: 4px;
            max-width: 300px;
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
            font-size: 60%;
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
        this.elementGrantAllPermissions = await this.$(".adbPermissionGrantRevoke");
        this.elementGrantAllPermissionsContent = await this.$(".adbPermissionGrantRevokeContent");
        const allGranted = this.adbPermissions.allGranted;
        UtilDOM.showOrHide(this.elementGrantAllPermissions,!allGranted)
        this.elementGrantAllPermissionsContent.innerHTML = "Grant All Permissions";
        if(!allGranted){
            this.elementGrantAllPermissions.onclick = async () => {
                this.elementGrantAllPermissionsContent.innerHTML = "Getting missing permissions...";
                await EventBus.post(new RequestGrantAllPermissions());
            }
        }

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
        this.elementADBPermissionUsedFor.innerHTML = `<b>Used for</b>: ${this.adbPermission.usedFor}${this.adbPermission.canBeGrantedInSystem ? "<br/><br/><b>Note</b>: this permission can be manually granted in Android itself" : ""}`;

        const granted = this.granted;
        UtilDOM.addOrRemoveClass(this.elementADBPermissionGrantRevoke, granted, "granted");
        this.elementADBPermissionGrantRevokeContent.innerHTML = granted ? "Granted (click to revoke)" : "Revoked (click to grant)"

        this.elementADBPermissionGrantRevoke.onclick = async () => {
            const adbPermission = this.adbPermission;
            const grant = !this.granted;
            await EventBus.post(new RequestGrantRevokePermission({ adbPermission, grant }));
        }

    }
    get granted() {
        return this.adbPermission.granted;
    }
}
class RequestGrantAllPermissions {}
class RequestGrantRevokePermission {
    constructor({ adbPermission, grant }) {
        this.adbPermission = adbPermission;
        this.grant = grant;
    }
}