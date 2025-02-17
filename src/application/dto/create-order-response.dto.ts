export class CreateOrderResponseDto {
  orderId: string;
  qrCode: string;

  constructor(orderId: string, qrCode: string) {
    this.orderId = orderId;
    this.qrCode = qrCode;
  }
}
