import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserQuantity1777469300000 implements MigrationInterface {
    name = "AddUserQuantity1777469300000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "User" ADD COLUMN "quantity" integer NOT NULL DEFAULT 1`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" RENAME TO "temporary_User"`);
        await queryRunner.query(
            `CREATE TABLE "User" ("userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "reservedConcertId" integer NOT NULL, "status" varchar NOT NULL, "isReserved" boolean NOT NULL, "reservationExpiresAt" datetime, CONSTRAINT "FK_e603dd26a131a808f48e002cf17" FOREIGN KEY ("reservedConcertId") REFERENCES "Ticket" ("concertId") ON DELETE NO ACTION ON UPDATE NO ACTION)`
        );
        await queryRunner.query(
            `INSERT INTO "User"("userId", "reservedConcertId", "status", "isReserved", "reservationExpiresAt") SELECT "userId", "reservedConcertId", "status", "isReserved", "reservationExpiresAt" FROM "temporary_User"`
        );
        await queryRunner.query(`DROP TABLE "temporary_User"`);
    }
}
