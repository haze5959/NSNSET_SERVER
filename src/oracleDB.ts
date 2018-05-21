import oracledb from 'oracledb';
var Oracledb = require('oracledb');

const dbconfig: oracledb.IConnectionAttributes =  {
    user          : "c##haze5959",
    password      : "Fkdhsgkwp12#",
    connectString : "192.168.0.2/orcl"
};

export default class Database {
    private pool: oracledb.IConnectionPool;    
    constructor() {  
    }

    public createPool(): void {
        
        Oracledb.createPool(dbconfig).then(conpool => {
                this.pool = conpool;
                Oracledb.fetchAsString.push(oracledb.DATE);
                Oracledb.fetchAsString.push(oracledb.CLOB);
                Oracledb.autoCommit = true;
                console.log('Connection Pool created!');
            },
            err => {
                console.log('Error creating pool!');
            });
    }

    public getConnection() {
        return Oracledb.getConnection();
    }    
}
