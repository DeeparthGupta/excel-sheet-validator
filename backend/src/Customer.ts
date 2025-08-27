import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity({ name: "customers" })
export class Customer{

    @PrimaryGeneratedColumn()
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