import { UtilDOM } from "./utildom.js";
import { EventBus } from "../js/eventbus.js";
import { Util } from "../js/util.js";

const elements = {};
class ExtendableProxy {
    constructor(useProxy) {
        if(!useProxy) return;
        
        const me = this;
        return new Proxy(this, {
            set: (target, key, value, proxy) => {
                me.setProperty(key,value);
                return true;
            },
            get: (target, key) => {
                return me.getProperty(key);
            }
        });
    }
    setProperty(key,value){
        this[key] = value;
    }
    async getProperty(key){
        return this[key];
    }
}
export class Control extends ExtendableProxy {

    constructor(useProxy){
        super(useProxy);
        if(this.dynamicElements){
            const getElement = (name) => {
                const element = this[`${name}Element`];
                if(!element) return;
                
                return element;
            }
            this.values = new Proxy(this, {
                get(target, name, receiver) {
                    if(target[name]) {
                        return target[name];
                    }
                    const element = getElement(name);
                    if(!element) return null;

                    const tagName = element.tagName;
                    if(tagName == "IMG"){
                        return element.src;
                    }else if(tagName == "INPUT"){
                        return element.value;
                    }
                    return element.innerHTML;
                },
                async set(target, name, value, receiver) {
                    if(target[name]) {
                        target[name] = value;
                        return true;
                    }

                    const element = getElement(name);
                    if(!element) return true;               

                    const tagName = element.tagName;
                    if(tagName == "IMG" && value){
                        if(Util.isString(value) && value.startsWith("icons")){
                            value = `./${value}`;
                        }else{
                            value = await GoogleDrive.convertFilesToGoogleDriveIfNeeded({files:value,downloadToBase64IfNeeded:true,authToken:this.authToken});
                        }
                        element.src = value;
                        return true;
                    }else if(tagName == "INPUT"){
                        element.value = value;
                        return true;
                    }
                    element.innerHTML = target.replaceSpecialCharacters(value) || "";
                    return true;
                }
            });                
        }        
    }
    async renderList(parent,list,itemControlClass,condition,extraArgs,controls){
        const clearBeforeAdding = controls ? false : true;
        if(clearBeforeAdding){
            parent.innerHTML = "";
        }
        
        if(!list) return;

        if(clearBeforeAdding){
            controls = [];
        }
        for(const item of list){
            if(condition && !condition(item)) continue;
            
            let render = null;
            try{
                const control = new itemControlClass(item,extraArgs);
                controls.push(control);
                render = await control.render();
            }catch(error){
                console.log("Warning, error rendering", this, error);
                render = itemControlClass(item);
            }
            parent.appendChild(render);
        }
        return controls;
    }
    replaceSpecialCharacters(value){
        return Util.replaceAll(value,"\n","<br/>")
    }
    set data(values){
        if(!this.dynamicElements) return;
        
        Object.assign(this.values,values);
    }
    get dynamicElements(){
        return false;
    }
    async querySelector(query){
        return (await this.getElement()).querySelector(query);
    }
    
    $(query){
        return this.querySelector(query);
    }
    async getElement(){
        if(this.element) return this.element;

        let html = this.html;
        let htmlFile = html ? Util.getType(this) : this.getHtmlFile();
        var element = elements[htmlFile];
        try{            
            
            if(element){
                element = element.cloneNode(true);
                return element;
            } 
            
            const style = this.css;
            if(style){
                UtilDOM.addStyle(style);
            }
            const styleFile = await this.getCssFile();
            if(styleFile){
                UtilDOM.addStyleFromFile(styleFile);
            }
            
            if(!html){
                // let localPath = window.document.location.href
                // if(localPath.startsWith("file://")){
                //     localPath = localPath.substring(0,localPath.lastIndexOf("/")+1);
                //     htmlFile = htmlFile.replace("./",localPath)
                // }
                const htmlResult = await fetch(htmlFile);
                html = await htmlResult.text();                    
            }
            const document = new DOMParser().parseFromString(html,"text/html");
            element = document.firstChild.children[1].firstChild.cloneNode(true);
            elements[htmlFile] = element;
            return element;
        }finally{
            this.element = element;
        }
    }
    focus(){
        if(!this.root) return;

        this.root.focus();
    }
    async render(){
        const root = await this.getElement();
        this.root = root;
        await this.renderSpecific(root);
        return root;
    }
    
    async renderInto(childControl,parent,clearParent = true){
        const render = await childControl.render();       
        if(clearParent){
            parent.innerHTML = "";
        } 
        parent.appendChild(render);
    }
    //open
    async unload(justSelf){
        await Control.unloadControls(this,justSelf);
    }
    async dispose(justSelf){
        await this.unload(justSelf);
        if(!this.root) return;
        
        const parent = this.root.parentElement;
        if(!parent) return;

        parent.removeChild(this.root);
        this.root = null;
        this.element = null;
    }
    //abstract
    getHtmlFile(){}
    //abstract
    get html(){}
    //abstract
    async renderSpecific(root){}
    //abstract
    async getCssFile(){}
    //abstract
    get css(){}
    
    static async unloadControls(obj,justSelf){
        await EventBus.unregister(obj);
        if(justSelf) return;

        for(const prop in obj){
            const value = obj[prop];
            // if(Util.isArray(value)){
            //     for(const item of value){
            //         if(!Util.isSubTypeOf(item,"Control")) continue;
            //         await item.unload();
            //     }
            // }
            if(!Util.isSubTypeOf(value,"Control")) continue;

            await value.unload();
        }
    }
}