export type MoStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export class ManufacturingStateMachine {
  private static transitions: Record<MoStatus, MoStatus[]> = {
    DRAFT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['DONE'],
    DONE: [],
    CANCELLED: [],
  };

  static validateTransition(from: MoStatus, to: MoStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
}
