export type PurchaseStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';

export class PurchaseStateMachine {
  private static transitions: Record<PurchaseStatus, PurchaseStatus[]> = {
    DRAFT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED'],
    PARTIALLY_RECEIVED: ['FULLY_RECEIVED'],
    FULLY_RECEIVED: [],
    CANCELLED: [],
  };

  static validateTransition(from: PurchaseStatus, to: PurchaseStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
}
