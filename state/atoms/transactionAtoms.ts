import { atom } from 'jotai'

export enum TransactionStatus {
  IDLE = '@transaction-status/idle',
  EXECUTING = '@transaction-status/executing',
}

export const transactionStatusState = atom<TransactionStatus>(
  TransactionStatus.IDLE
)
