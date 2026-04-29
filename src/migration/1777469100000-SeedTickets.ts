import type { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTickets1777469100000 implements MigrationInterface {
    name = "SeedTickets1777469100000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO "Ticket" ("concertName", "stock", "category") VALUES
            ('Rock Fest', 100, 'general'),
            ('Jazz Night', 100, 'VIP'),
            ('City Pop Live', 100, 'general'),
            ('Symphony Gala', 100, 'VIP')`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "Ticket" WHERE "concertName" IN (
                'Rock Fest',
                'Jazz Night',
                'City Pop Live',
                'Symphony Gala'
            )`
        );
    }
}
