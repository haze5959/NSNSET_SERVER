import redis from 'redis';

const port:number = 3000;
const host:string = "192.168.0.2/orcl";



export default class Database {
    private client: redis.RedisClient;    
    constructor() {  
    }

    public createPool(): void {
        this.client = redis.createClient(port, host);

        this.client.on("error", function (err) {
            console.error("redis Error " + err);
        });

        this.client.h
    }

    public getClient(): redis.RedisClient {
        return this.client;
    }    
}