export class UtilDOM{
    static getElementOrRoot(element){
        if(!element) return;

        if(!element.classList && element.root){
            element = element.root;
        }
        return element;
    }
    static addAttribute(element,attribute,value){
        element.setAttribute(attribute,value);
    }
    static removeAttribute(element,attribute){
        element.removeAttribute(attribute);
    }
    static addOrRemoveAttribute(element, add, attribute, value){
        if(add){
            UtilDOM.addAttribute(element,attribute,value);
        }else{
            UtilDOM.removeAttribute(element,attribute);
        }
    }
    static hasClass(element,clazz){
        return element.classList.contains(clazz);
    }
    static addOrRemoveClass(element, add, clazz){
        if(!element) return;

        element = UtilDOM.getElementOrRoot(element);
        if(!element) return;

        if(add){
            element.classList.add(clazz);
        }else{
            element.classList.remove(clazz);
        }
    }
    static showOrHide(element, show){
        UtilDOM.addOrRemoveClass(element,!show,"hidden");
        if(show){
            UtilDOM.addOrRemoveClass(element,false,"invisible");
        }
    }
    static showOrMakeInvisible(element, show){
        UtilDOM.addOrRemoveClass(element,!show,"invisible");
        UtilDOM.addOrRemoveClass(element,false,"hidden");
    }
    static show(element){
        UtilDOM.showOrHide(element,true);
    }
    static hide(element){
        UtilDOM.showOrHide(element,false);
    }
    static makeInvisible(element){
        UtilDOM.showOrMakeInvisible(element,false);
    }
    static toggleShow(element){
        element = UtilDOM.getElementOrRoot(element);
        UtilDOM.showOrHide(element,element.classList.contains("hidden"));
    }
    static isEnabled(element){
        return !element.classList.contains("disabled");
    }
    static enable(element){
        element.disabled = false;
        UtilDOM.addOrRemoveClass(element,false,"disabled");
    }
    static disable(element){
        element.disabled = true;
        UtilDOM.addOrRemoveClass(element,true,"disabled");
    }
    static enableDisable(element,enable){
        if(enable){
            UtilDOM.enable(element)
        }else{
            UtilDOM.disable(element);
        }
    }
    /**
     * returns {top,left,right,bottom}
     */
    static getElementBounds(element){
        return element.getBoundingClientRect();
    }
    static scrollToBottom(element){
        element.scrollTop = element.scrollHeight;
    }
    static addStyle(css){
        const sheet = document.createElement('style')
        sheet.innerHTML = css;
        return document.head.appendChild(sheet);
    }
    static async addScriptFile(scriptFile){
        const document = self.window.document;
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = scriptFile;
        script.async = false;
        document.head.insertBefore(script,document.head.firstChild);
    }
    static createElement({type,id,content,parent,clazz,classes}){
        const element = document.createElement(type);
        if(id){
            element.id = id;
        }
        if(content){
            element.innerHTML = content;
        }
        if(parent){
            parent.appendChild(element);
        }
        if(clazz){
            element.classList.add(clazz);
        }
        if(classes && classes.length > 0){
            if(Util.isString(classes)){
                if(classes.includes(",")){
                    classes = classes.split(",")
                }else{
                    classes = classes.split(" ")
                }
            }
            classes.forEach(clazz=>element.classList.add(clazz));
        }
        return element;
    }
    static async addScriptFiles(...scriptFiles){
        for(const scriptFile of scriptFiles){
            await UtilDOM.addScriptFile(scriptFile);
        }
    }
    static async addStyleFromFile(file){
        const cssResult = await fetch(file);
        const css = await cssResult.text();
        return this.addStyle(css);
    }
    static focusWindow(){
        if(window.document.hasFocus()) return;
        return new Promise(resolve=>{
            const existingOnFocus = window.onfocus;
            window.onfocus = () => {
                resolve();
                window.onfocus = existingOnFocus;
            }
            window.focus();
        });
    }
    static waitForWindowFocus(){
        return new Promise(resolve=>{
            const existingOnFocus = window.onfocus;
            window.onfocus = () => {
                resolve();
                window.onfocus = existingOnFocus;
            }
        });
    }
    static doOnUnload(callback){
        document.body.onbeforeunload = ()=>{
            callback();
        }
    }
    static setCssVariable(name,value){
        document.documentElement.style.setProperty(`--${name}`, value);
    }
    static setCssVhVariableAndListenToWindowChanges(){
        const set = () => UtilDOM.setCssVariable("vh",`${window.innerHeight * 0.01}px`);
        set();
        window.addEventListener('resize',set);
    }
    static setImageSourceOrHide(imageElement,source){
        if(source){
            imageElement.src = source;
            UtilDOM.show(imageElement)
        }else{
            UtilDOM.hide(imageElement)
        }
    }
    static setInnerHTMLOrHide(element,html){
        if(html){
            element.innerHTML = html;
            UtilDOM.show(element)
        }else{
            UtilDOM.hide(element)
        }
    }
    static onEnterKey(element,callback){
        if(!element.inputElementKeyDown){
            element.inputElementKeyDown = e => {
                if(e.keyCode != 13 || e.shiftKey) return;
                
                e.preventDefault();
                callback(e);
            };
        }
        element.removeEventListener("keydown",element.inputElementKeyDown);
        element.addEventListener("keydown",element.inputElementKeyDown);
    }
    static eventToCoordinates(e){
        e.coordinateX = e.clientX || (event.touches ? event.touches[0].clientX : 0);
        e.coordinateY = e.clientY || (event.touches ? event.touches[0].clientY : 0);        
        return e;
    }
    static eventToCoordinatesHandler(handler){
        return e => handler(UtilDOM.eventToCoordinates(e));
    }
    static setOnTouchDown(element,handler){
        element.onmousedown = handler;
        element.ontouchstart = handler;
    }
    static setOnTouchUp(element,handler){
        element.onmouseup = handler;
        element.ontouchend = handler;
    }
    static setOnTouchMove(element,handler){
        element.onmousemove = handler;
        element.ontouchmove = handler;
    }
    static setOnTouchDownCoordinates(element,handler){
        UtilDOM.setOnTouchDown(element, UtilDOM.eventToCoordinatesHandler(handler));
    }
    static setOnTouchMoveCoordinates(element,handler){
        UtilDOM.setOnTouchMove(element, UtilDOM.eventToCoordinatesHandler(handler));
    }
    static async pickFiles(){
        const id = "mysuperduperfilepickeryeahhhhh"
        let fileInput = document.querySelector(`#${id}`);
        if(fileInput){
            fileInput.remove();
        }
        // if(!fileInput){
            fileInput = document.createElement("input");
            fileInput.id = id;
            fileInput.setAttribute("type","file");
            UtilDOM.hide(fileInput);
            document.body.appendChild(fileInput);
        // }
        return new Promise(resolve=>{            
            fileInput.onchange = async () => {
                const files = fileInput.files;
                if(!files || files.length == 0) return;

                resolve(files);
            }
            fileInput.click();
        })
    }
    static readPickedFile(file){
        return new Promise((resolve,reject) => {
			if(!file){
				return reject("No file to read");
			}
			var fr = new FileReader();
			fr.onload = function () {
				resolve(fr.result);
			}
			fr.readAsDataURL(file);
		});
    }
    
    static async getUsableImgOrSvgElementSrc({src,defaultImage,convertToData,token}){
        if(!src) return `<img src="${defaultImage || ""}" />`;
        if(src.startsWith("<img")) return src;
        if(src.includes("<svg")){
            if(!src.includes("fill=")) return src;
            
            const parser = new DOMParser();
            const element = parser.parseFromString(src, "text/xml");
            element.querySelector("[fill]").setAttribute("fill",null)
            return element.querySelector("svg").outerHTML;
        }

        const imageElement = UtilDOM.createElement({type:"img"});
        try{
            if(!src.startsWith("data:image/") && convertToData){
                src = await Util.getImageAsBase64(src,token);
            }
        }catch{}
        imageElement.src = src;
        return imageElement.outerHTML;
    }
    static onclickandlongclick(element, onclick, onlongclick){
		element.onmousedown = eDown=>{
			var long = true;
			var short = true;
			setTimeout(()=>{
				short = false;
				if(long){
					onlongclick(eDown);
				}
			},500);
			element.onmouseup = eUp => {
				element.onmouseup = null;
				long = false;
				if(short){
					onclick(eUp);
				}
			}
		}
    }
    static handleDroppedFiles(element,ondrop,ondragover){
        element.ondragover = e => {
			e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if(ondragover){
                ondragover();
            }
        }
        
		element.ondrop = async e => {
			if(e.dataTransfer.getData("index")){
				return;
			}
			e.preventDefault();
            e.stopPropagation();		
            await ondrop(e.dataTransfer.files);
        }
        element.onpaste = async e => {
            await ondrop(Util.getPastedFiles(e));
        }
    }  
      
    static increaseBrightnessRule(style, propertyName, percent){
		var originalColor = style.getPropertyValue(propertyName);
		if(!originalColor){
			return;
		}		
        originalColor = originalColor.trim();
		var newColor = Util.shadeBlendConvert(percent/100,originalColor);
		return newColor;
    }
    static increaseBrightness(originalColor,percent){
        return Util.shadeBlendConvert(percent/100,originalColor);
    }
    static preventEventPropagation(event){
        if(!event) return;

        if (event.stopPropagation){
            event.stopPropagation();
        }
        if (event.preventDefault){
            event.preventDefault();
        }
    }
    static setWrapperCheckboxClick(wrapper){
        wrapper.onclick = e => {
            const checkbox = wrapper.querySelector("input[type=checkbox]");
            if (checkbox == e.target)  return;
        
            checkbox.checked = !checkbox.checked;
        }
    }
    static toList(any){
        return Array.from(any);
    }
}