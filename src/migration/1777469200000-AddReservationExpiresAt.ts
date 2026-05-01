import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationExpiresAt1777469200000 implements MigrationInterface {
    name = "AddReservationExpiresAt1777469200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "User" ADD COLUMN "reservationExpiresAt" datetime NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" RENAME TO "temporary_User"`);
        await queryRunner.query(
            `CREATE TABLE "User" ("userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "reservedConcertId" integer NOT NULL, "status" varchar NOT NULL, "isReserved" boolean NOT NULL)`
        );
        await queryRunner.query(
            `INSERT INTO "User"("userId", "reservedConcertId", "status", "isReserved") SELECT "userId", "reservedConcertId", "status", "isReserved" FROM "temporary_User"`
        );
        await queryRunner.query(`DROP TABLE "temporary_User"`);
    }
}
