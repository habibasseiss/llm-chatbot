import pgp from "pg-promise";

export interface DatabaseConnection {
  query<T>(statement: string, params?: any): Promise<T>;
  one<T>(statement: string, params?: any): Promise<T>;
  close(): Promise<void>;
}

export class PostgresDatabaseConnection implements DatabaseConnection {
  connection: pgp.IDatabase<{}>;

  constructor(connectionString: string) {
    this.connection = pgp()(connectionString);
  }

  query<T>(statement: string, params?: any) {
    return this.connection.query<T>(statement, params);
  }

  one<T>(statement: string, params?: any) {
    return this.connection.one<T>(statement, params);
  }

  close() {
    return this.connection.$pool.end();
  }
}
