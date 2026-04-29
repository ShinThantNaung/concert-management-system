import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Ticket } from "./Ticket.ts";

@Entity("User")
export class User {
    @PrimaryGeneratedColumn()
    userId!: number;

    @Column()
    reservedConcertId!: number;

    @ManyToOne(() => Ticket, (ticket) => ticket.reservations)
    @JoinColumn({ name: "reservedConcertId" })
    ticket!: Ticket;

    @Column({ type: "text", enum: ["PENDING", "COMPLETET"] })
    status!: "PENDING" | "COMPLETET";

    @Column()
    isReserved: boolean=false;
}
