import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Ticket } from "./Ticket.js";

@Index("IDX_user_status_pending", ["status"], { where: "\"status\" = 'PENDING'" })
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

    @Column({ type: "datetime", nullable: true })
    reservationExpiresAt!: Date | null;
}
