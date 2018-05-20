import oracledb from 'oracledb';

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
        oracledb.fetchAsString = [ oracledb.DATE, oracledb.CLOB ];
        oracledb.createPool(dbconfig).then(conpool => {
                this.pool = conpool;
                console.log('Connection Pool created!');
            },
            err => {
                console.log('Error creating pool!');
            });
    }

    public getConnection() {
        oracledb.fetchAsString = [ oracledb.DATE, oracledb.CLOB ];
        return oracledb.getConnection();
    }    
}
