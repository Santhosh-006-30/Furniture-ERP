export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_DELIVERED' | 'FULLY_DELIVERED' | 'CANCELLED';

export class SalesStateMachine {
  private static transitions: Record<OrderStatus, OrderStatus[]> = {
    DRAFT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'CANCELLED'],
    PARTIALLY_DELIVERED: ['FULLY_DELIVERED'],
    FULLY_DELIVERED: [],
    CANCELLED: [],
  };

  /**
   * Validates if a transition from `from` state to `to` state is permitted.
   */
  static validateTransition(from: OrderStatus, to: OrderStatus): boolean {
    const valid = this.transitions[from]?.includes(to) ?? false;
    return valid;
  }
}
