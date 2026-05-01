export type concertIdDTO = {
    concertId: number;
};

export type concertNameDTO = {
    name: string;
};

export type createReservationDTO = {
    userId: number;
    concertId: number;
    quantity: number;
};

export type createPurchaseDTO = {
    userId: number;
    concertId: number;
    quantity: number;
};