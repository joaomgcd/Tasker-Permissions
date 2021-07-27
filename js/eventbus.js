export class EventBus{
	static get(){
		return instance
	}
	static register(obj){
		return EventBus.get().register(obj)
	}
	static unregister(obj){
		return EventBus.get().unregister(obj)
	}
	static registerSticky(obj){
		return EventBus.get().registerSticky(obj)
	}
	static async post(obj, className){
		return await (EventBus.get().post(obj,className));
	}
	static async postAndWaitForResponse(data, classResponse, timeout, className){  
		return await (EventBus.get().postAndWaitForResponse(data, classResponse, timeout, className));
	}
	static postSticky(obj){
		return EventBus.get().postSticky(obj)
	}
	static waitFor(clazz,timeout){
		return EventBus.get().waitFor(clazz,timeout)
	}
    constructor(){
        this.registered = [];
        this.registeredSticky = [];
        this.stickyData = {};
    }
    getEventName(className){
      return "on" + className;
    }
	register(obj){	
		const index = this.registered.indexOf(obj);
		if(index != -1){
			return;
		}
		this.registered.push(obj);
        // console.log("EventBus registered",this.registered.length);
	}
	async registerSticky(obj){	
		const index = this.registeredSticky.indexOf(obj);
        if(index != -1){
          return;
        }
		this.registeredSticky.push(obj);
        for(const propObj in obj){
          for(const propSticky in this.stickyData){
            if(this.getEventName(propSticky) == propObj){
              await obj[propObj].call(obj,this.stickyData[propSticky]);
              return;
            }
          }
        }
        // console.log("EventBus registered sticky",this.registeredSticky.length);
	}
    removeStickyData(clazz){
      if(clazz){
        delete this.stickyData[clazz.name];
      }else{
        this.stickyData = {};
      }
    }
	unregister(obj){		
		const index = this.registered.indexOf(obj);
		if(index != -1){
			this.registered.splice(index,1);
		}
		const indexSticky = this.registeredSticky.indexOf(obj);
		if(indexSticky != -1){
			this.registeredSticky.splice(indexSticky,1);
		}
	}
    async sendToRegistered(data, registered, className){
		if(!className){
			className = data.constructor.name;
		}
		for (var i = 0; i < registered.length; i++) {
			const subscriber = registered[i];
			const eventName = this.getEventName(className);
			const funcToCall = subscriber[eventName];
			if(funcToCall){
				await funcToCall.call(subscriber,data);
			}
		}
    }
	async postAndWaitForResponse(data, classResponse, timeout, className){  
		const resultPromise = this.waitFor(classResponse,timeout);
		await this.post(data,className);
		return await resultPromise;
	}
	async post(data, className){  
      await this.sendToRegistered(data,this.registered,className);
	}
	async postSticky(data){        
      var className = data.constructor.name;
      this.stickyData[className] = data;
	  await this.sendToRegistered(data,this.registeredSticky);
	  const nonSticky = this.registered.filter(r=>!this.registeredSticky.includes(r));
      await this.sendToRegistered(data,nonSticky); 
	}
    getWaitForPromise(clazz,timeout,registerFunc){
		const me = this;
		let nameToWait = null;
		if(clazz && clazz.constructor && clazz.constructor.name == "String"){
			nameToWait = clazz;
		}else{
			nameToWait = clazz.name;
		}
		return new Promise((resolve,reject)=>{        
			var objToRegister = {};
			var timeOutObject = null;
			if(timeout){
				timeOutObject = setTimeout(()=>{
					reject("Timed out");
					me.unregister(objToRegister);
				},timeout);
			}
			objToRegister[this.getEventName(nameToWait)] = (data)=>{
				if(timeOutObject){
					clearTimeout(timeOutObject);
				}
				me.unregister(objToRegister);
				resolve(data);
			}
			registerFunc.call(me,objToRegister);        
		});
    }
    waitFor(clazz,timeout){
      return this.getWaitForPromise(clazz,timeout,this.register);
    }
    waitForSticky(clazz,timeout){
      return this.getWaitForPromise(clazz,timeout,this.registerSticky);
	}
	getSticky(clazz){
		return this.stickyData[clazz.name];
	}
    getStickyData(){
    	return this.stickyData;
    }
    getRegistered(){
    	return [this.registered, this.registeredSticky];
    }
}
const instance = new EventBus();

export class Test{}