import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import type { Ticket } from "./Ticket.js";

@Entity("User")
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column({ type: "integer" })
  reservedConcertId!: number;

  ticket?: Ticket;

  @Column({ type: "text", enum: ["PENDING", "COMPLETED"] })
  @Index("IDX_PENDING_TICKETS", ["status"], {
    where: "status = 'PENDING'",
  })
  status!: "PENDING" | "COMPLETED";

  @Column({ type: "boolean" })
  isReserved: boolean = false;

  @Column({ type: "integer", default: 1 })
  quantity: number = 1;

  @Column({ type: "datetime", nullable: true })
  reservationExpiresAt!: Date | null;
}
