import { Column, Entity, ObjectIdColumn } from "typeorm";


@Entity({ name: "customers" })
export class CustomerMongo{

    @ObjectIdColumn()
    serial_number!: number;
    
    @Column({ type: "text" })
    customer_name!: string;

    @Column({ type: "integer" })
    number!: number;

    @Column({ type: "text" })
    email!: string;

    @Column({ type: "text" })
    time!: string;
}