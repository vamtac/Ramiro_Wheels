export interface Booking {
  id: string;
  pickupReturnStationId: string;
  customerName: string;
  startDate: string;
  endDate: string;
}

export interface Station {
  id: string;
  name: string;
  bookings: Booking[];
}
