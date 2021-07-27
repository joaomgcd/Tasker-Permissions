
const child_process = require('child_process');

export class CommandLine{
    /**
     * 
     * @param {String} command 
     * @param {String[]} args 
     */
    static run(command, args){
        return new Promise((resolve,reject)=>{
            const child = child_process.spawn(command, args, {encoding: 'utf8',shell: true});
            
            child.on('error',error=>reject(error));
        
            let outData = [];
            child.stdout.setEncoding('utf8');
            child.stdout.on('data',data=>outData.push(data));
        
            let errorData = [];
            child.stderr.setEncoding('utf8');
            child.stderr.on('data',data=>errorData.push(data));   

            child.on('close', code => {
                const out = outData.join("");
                const error = errorData.join("");
                const result = {code,out,error}
                resolve(result);                
            });
        });
    }
}