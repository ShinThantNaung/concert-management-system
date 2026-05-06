# This is a concert ticket seller project build for practice

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

| Request                      |                      Description                       |
| :--------------------------- | :----------------------------------------------------: |
| GET /api/concerts            |                 Get Availabe Concerts                  |
| GET /api/concerts/:id        |                   Get Concert by Id                    |
| GET /api/concerts/name/:name |                  Get Concert by Name                   |
| POST /api/reserve            |          Create a reservation with 5 mins TTL          |
| POST /api/purchase           | Purchase the pending ticket or directly buy the ticket |

## B-Tree Indexing vs Partial Indexing

- It's found out that Partial Indexing is better at clean up job since it targets only the filtered column, making the cleanup of the pending entries more effectively.

## Explain Query Plan

- The SQLite `EXPLAIN QUERY PLAN` output shows the queries use the created indexes: the `Ticket` lookup uses the primary-key/rowid access and the `User` lookup uses the `IDX_user_status_pending` partial index, confirming the indices are active and being used by the query planner.

## Race Condition Fix

- To prevent overselling under concurrent reservations/purchases an atomic conditional update was used inside a database transaction: decrement the `Ticket.stock` with `UPDATE ... SET stock = stock - 1 WHERE concertId = ? AND stock > 0`, check the affected row count, and only create the `User` reservation/purchase when the update succeeded. Operations run inside a `QueryRunner` transaction and rollback on error, ensuring atomicity and avoiding race conditions.

## Choosing Indices

- The B-tree indexing is chose for the concertId column since querying the whole column would be too unperformative and has the time complexity of O(n), which is reduced to O(log(n)) by using the indexing.
- The Partial indexing is chose for the status column since it's required only for the rows where status = "PENDING"

## AI aspect

### Benefits

- AI helped me to write the template codes such as setting up api routes, config files and setting up the database connections in such a short time.

### Hinders

- AI doesn't know the requirements and often applied the wrong logic or applied the logic to wrong functions or routes.

## Stress Test

- The optimistic control worked. The first user received 201 and other user received 409 error with message "Concert is sold out".
- Pessimistic concurrency control is not supported for sqlite

## Logs

### Logs for an error with negative concertId

{"level":40,
"time":"2026-05-06T14:36:46.483Z",
"pid":11824,
"hostname":"MSI",
"correlationId":"7dd9f2ac-c1b1-44f4-81b0-608aecec23a4",
"event":"validation_error",
"issues":["Invalid input: expected number, received NaN","Not a positive integer"],"method":"POST","path":"/api/reserve",
"msg":"Validation error"}

## Swagger documentation
<img width="1882" height="889" alt="Screenshot 2026-05-06 213910" src="https://github.com/user-attachments/assets/c8822111-d948-4884-b1c8-b0a79dc6728a" />

