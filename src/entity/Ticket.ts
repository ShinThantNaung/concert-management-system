import { Entity, PrimaryGeneratedColumn, Column, Index, VersionColumn } from "typeorm";

@Entity("Ticket")
export class Ticket {
    @PrimaryGeneratedColumn()
    @Index()
    concertId!: number;

    @Column({ type: "text" })
    concertName!: string;
    
    @Column({ type: "integer" })
    stock: number = 100;

    @Column({ type: "text", enum: ["VIP", "general"] })
    category!: "VIP" | "general";

    @VersionColumn({ type: "integer" })
    version!: number;

}
