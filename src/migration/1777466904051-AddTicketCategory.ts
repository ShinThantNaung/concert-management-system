import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketCategory1777466904051 implements MigrationInterface {
    name = 'AddTicketCategory1777466904051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Ticket" ADD COLUMN "category" varchar CHECK( "category" IN ('VIP','general') ) NOT NULL DEFAULT 'general'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Ticket" RENAME TO "temporary_Ticket"`);
        await queryRunner.query(
            `CREATE TABLE "Ticket" ("concertId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "stock" integer NOT NULL)`
        );
        await queryRunner.query(
            `INSERT INTO "Ticket"("concertId", "stock") SELECT "concertId", "stock" FROM "temporary_Ticket"`
        );
        await queryRunner.query(`DROP TABLE "temporary_Ticket"`);
    }

}
