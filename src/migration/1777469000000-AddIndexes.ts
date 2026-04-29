import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexes1777469000000 implements MigrationInterface {
    name = "AddIndexes1777469000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_ticket_concertId" ON "Ticket" ("concertId")`
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_user_status_pending" ON "User" ("status") WHERE status = 'PENDING'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_status_pending"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticket_concertId"`);
    }
}
