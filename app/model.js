export class Models extends Array{
    constructor(infos){
        if(Number.isInteger(infos)){
            super(infos);
            return;
        }
        super();
        if(!infos) return;
        
        infos.forEach(info => this.push(new this.modelClass(info)))
    }
    get modelClass(){
        console.log("Didn't implement modelClass", this);
        throw Error("Unimplemented modelClass",this);
    }
}

export class Model{
    constructor(info){
        Object.assign(this,info);
    }
}