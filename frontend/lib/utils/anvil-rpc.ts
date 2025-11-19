// frontend/lib/utils/anvil-rpc.ts
/**
 * Utility functions to interact with Anvil's RPC methods
 * Used for testing time manipulation in local development
 */

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

/**
 * Increase the blockchain time by a specified number of seconds
 * @param seconds - Number of seconds to fast-forward
 */
export async function increaseTime(seconds: number): Promise<void> {
  try {
    // Call evm_increaseTime
    await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [seconds],
        id: 1,
      }),
    });

    // Mine a new block to apply the time change
    await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: 2,
      }),
    });

    console.log(`⏰ Time increased by ${seconds} seconds`);
  } catch (error) {
    console.error('Failed to increase time:', error);
    throw new Error('Time manipulation failed. Are you connected to Anvil?');
  }
}

/**
 * Get the current block timestamp from the blockchain
 * @returns Current block timestamp in seconds
 */
export async function getBlockTimestamp(): Promise<number> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
        id: 1,
      }),
    });

    const data = await response.json();
    const timestamp = parseInt(data.result.timestamp, 16);
    return timestamp;
  } catch (error) {
    console.error('Failed to get block timestamp:', error);
    throw new Error('Could not fetch block timestamp');
  }
}

/**
 * Get the current block number
 * @returns Current block number
 */
export async function getBlockNumber(): Promise<number> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    const blockNumber = parseInt(data.result, 16);
    return blockNumber;
  } catch (error) {
    console.error('Failed to get block number:', error);
    throw new Error('Could not fetch block number');
  }
}

/**
 * Helper function to convert time units to seconds
 */
export const timeUnits = {
  seconds: (n: number) => n,
  minutes: (n: number) => n * 60,
  hours: (n: number) => n * 60 * 60,
  days: (n: number) => n * 24 * 60 * 60,
  weeks: (n: number) => n * 7 * 24 * 60 * 60,
};
