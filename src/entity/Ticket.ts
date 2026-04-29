import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User.ts";

@Entity("Ticket")
export class Ticket {
    @PrimaryGeneratedColumn()
    concertId!: number;

    @Column()
    concertName!: string;
    
    @Column()
    stock: number=100;

    @Column({ type: "text", enum: ["VIP", "general"] })
    category!: "VIP" | "general";

    @OneToMany(() => User, (user) => user.ticket)
    reservations!: User[];
}
