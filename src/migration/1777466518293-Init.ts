import type { MigrationInterface, QueryRunner } from "typeorm";

export class Init1777466518293 implements MigrationInterface {
    name = 'Init1777466518293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Ticket" ("concertId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "stock" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "User" ("userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "reservedConcertId" integer NOT NULL, "status" varchar NOT NULL, "isReserved" boolean NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "temporary_User" ("userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "reservedConcertId" integer NOT NULL, "status" varchar NOT NULL, "isReserved" boolean NOT NULL, CONSTRAINT "FK_e603dd26a131a808f48e002cf17" FOREIGN KEY ("reservedConcertId") REFERENCES "Ticket" ("concertId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_User"("userId", "reservedConcertId", "status", "isReserved") SELECT "userId", "reservedConcertId", "status", "isReserved" FROM "User"`);
        await queryRunner.query(`DROP TABLE "User"`);
        await queryRunner.query(`ALTER TABLE "temporary_User" RENAME TO "User"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" RENAME TO "temporary_User"`);
        await queryRunner.query(`CREATE TABLE "User" ("userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "reservedConcertId" integer NOT NULL, "status" varchar NOT NULL, "isReserved" boolean NOT NULL)`);
        await queryRunner.query(`INSERT INTO "User"("userId", "reservedConcertId", "status", "isReserved") SELECT "userId", "reservedConcertId", "status", "isReserved" FROM "temporary_User"`);
        await queryRunner.query(`DROP TABLE "temporary_User"`);
        await queryRunner.query(`DROP TABLE "User"`);
        await queryRunner.query(`DROP TABLE "Ticket"`);
    }

}
