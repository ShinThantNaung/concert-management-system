import { Entity, PrimaryGeneratedColumn, Column,Index } from "typeorm";
import type { Ticket } from "./Ticket.js";

@Entity("User")
export class User {
    @PrimaryGeneratedColumn()
    userId!: number;

    @Column({ type: "integer" })
    reservedConcertId!: number;

    ticket?: Ticket;

    @Column({ type: "text", enum: ["PENDING", "COMPLETET"] })
    @Index("IDX_PENDING_TICKETS", ["status"], {
        where: "status = 'PENDING'"
    })
    status!: "PENDING" | "COMPLETET";

    @Column({ type: "boolean" })
    isReserved: boolean=false;

    @Column({ type: "datetime", nullable: true })
    reservationExpiresAt!: Date | null;
}
