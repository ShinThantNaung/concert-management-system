import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketVersionAndSeedLowStockConcerts1777469400000
  implements MigrationInterface
{
  name = "AddTicketVersionAndSeedLowStockConcerts1777469400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Ticket" ADD COLUMN "version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `INSERT INTO "Ticket" ("concertName", "stock", "category", "version") VALUES
      ('Indie Basement Session', 1, 'general', 1),
      ('Solo Piano Night', 1, 'VIP', 1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "Ticket" WHERE "concertName" IN (
        'Indie Basement Session',
        'Solo Piano Night'
      )`,
    );
    await queryRunner.query(`ALTER TABLE "Ticket" RENAME TO "temporary_Ticket"`);
    await queryRunner.query(
      `CREATE TABLE "Ticket" ("concertId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "stock" integer NOT NULL, "category" varchar CHECK( "category" IN ('VIP','general') ) NOT NULL DEFAULT 'general', "concertName" varchar NOT NULL DEFAULT '' )`,
    );
    await queryRunner.query(
      `INSERT INTO "Ticket"("concertId", "stock", "category", "concertName") SELECT "concertId", "stock", "category", "concertName" FROM "temporary_Ticket"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_Ticket"`);
  }
}
