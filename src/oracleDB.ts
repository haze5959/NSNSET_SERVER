import oracledbType from 'oracledb';
var Oracledb = require('oracledb');

const dbconfig: oracledbType.IConnectionAttributes =  {
    user          : "c##haze5959",
    password      : "Fkdhsgkwp12#",
    connectString : "192.168.0.2/orcl"
};

export default class Database {
    private pool: oracledbType.IConnectionPool;    
    constructor() {  
    }

    public createPool(): void {
        
        Oracledb.createPool(dbconfig).then(conpool => {
                this.pool = conpool;
                Oracledb.fetchAsString  = [ Oracledb.DATE, Oracledb.CLOB ];
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
