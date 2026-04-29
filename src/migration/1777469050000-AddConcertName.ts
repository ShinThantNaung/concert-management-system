import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddConcertName1777469050000 implements MigrationInterface {
    name = "AddConcertName1777469050000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Ticket" ADD COLUMN "concertName" varchar NOT NULL DEFAULT ''`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Ticket" RENAME TO "temporary_Ticket"`);
        await queryRunner.query(
            `CREATE TABLE "Ticket" ("concertId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "stock" integer NOT NULL, "category" varchar CHECK( "category" IN ('VIP','general') ) NOT NULL DEFAULT 'general')`
        );
        await queryRunner.query(
            `INSERT INTO "Ticket"("concertId", "stock", "category") SELECT "concertId", "stock", "category" FROM "temporary_Ticket"`
        );
        await queryRunner.query(`DROP TABLE "temporary_Ticket"`);
    }
}
