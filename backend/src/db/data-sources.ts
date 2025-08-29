import "reflect-metadata";
import { DataSource } from "typeorm";
import { Customer } from "../db/Customer.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "root",
    database: "customer_data",
    synchronize: true,
    entities:[Customer]
})