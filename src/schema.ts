import * as z from "zod";

const notAnInteger : string = "Not an integer";
const notAPositiveInteger : string = "Not a positive integer";
const minQuantity : string = "Minimum quantity is 1";
const maxQuantity : string = "Maximum quantity is 5";

export const createReservationSchema = z.object({
    userId: z.coerce.number().int({message: notAnInteger}).positive({message: notAPositiveInteger}),
    concertId: z.coerce.number().int({message: notAnInteger}).positive({message: notAPositiveInteger}),
    quantity: z.coerce.number().int({message: notAnInteger}).positive({message: notAPositiveInteger}).min(1, {message: minQuantity}).max(5, {message: maxQuantity}).default(1)
});

export const createPurchaseSchema = z.object({
    userId: z.coerce.number().int({message: notAnInteger}).positive({message: notAPositiveInteger}),
    concertId: z.coerce.number().int({message: notAnInteger}).positive({message: notAPositiveInteger}),
    quantity: z.coerce.number().int({message: notAnInteger}).positive({message: notAPositiveInteger}).min(1, {message: minQuantity}).max(5, {message: maxQuantity}).default(1)
});

export type CreateReservationSchema = z.infer<typeof createReservationSchema>;
export type CreatePurchaseSchema = z.infer<typeof createPurchaseSchema>;