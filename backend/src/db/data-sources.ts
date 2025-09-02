import "reflect-metadata";
import { DataSource } from "typeorm";
import { CustomerPost } from "./CustomerPost.js";
import { CustomerMongo } from "./CustomerMongo.js";

export const RDBMSDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "root",
    database: "customer_data",
    synchronize: true,
    entities: [CustomerPost]
});

export const NoSQLDataSource = new DataSource({
    type: "mongodb",
    host: "localhost",
    port: 27017,
    database: "customer_data",
    entities: [CustomerMongo],
    synchronize: true,
});