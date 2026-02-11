import { keccak256, encodeAbiParameters, parseAbiParameters, toHex, encodePacked } from 'viem';

const PROXY_INITCODE_HASH = '0x21c35dbe1b344a2488cf3321d6ce542f8e9f305544ff09e4993a62319a497c1f';

function predictDeterministicAddress(salt: `0x${string}`, deployer: `0x${string}`): `0x${string}` {
    // Step 1: Calculate proxy address using CREATE2
    const proxyAddress = keccak256(
        encodePacked(
            ['bytes1', 'address', 'bytes32', 'bytes32'],
            ['0xff', deployer, salt, PROXY_INITCODE_HASH]
        )
    ).slice(-40);

    // Step 2: Calculate deployed contract address using RLP encoding (nonce 1)
    const rlpEncoded = encodePacked(
        ['bytes1', 'bytes1', 'address', 'bytes1'],
        ['0xd6', '0x94', `0x${proxyAddress}` as `0x${string}`, '0x01']
    );

    return `0x${keccak256(rlpEncoded).slice(-40)}` as `0x${string}`;
}

export function predictProxyAccount(
    path: bigint,
    channelId: number,
    senderBech32: string,  // The bech32 address as a STRING (e.g., "into1...")
    deployerAddress: `0x${string}`  // The zkgm contract address
): { address: `0x${string}`; salt: `0x${string}` } {
    // KEY INSIGHT: sender is the UTF-8 encoded bech32 string, not decoded bytes!
    const senderBytes = new TextEncoder().encode(senderBech32);

    const proxySalt = keccak256(
        encodeAbiParameters(
            parseAbiParameters('uint256, uint32, bytes'),
            [path, channelId, toHex(senderBytes)]
        )
    );

    const address = predictDeterministicAddress(proxySalt, deployerAddress);

    return { address, salt: proxySalt };
}

// Example usage:
const result = predictProxyAccount(
    BigInt(0),                                              // path
    3,                                                      // destination channelId on Base
    "into17yhjytau6zukq6g0wc8ynzm90tnn3qhzlucv6k",        // Intento sender address (bech32 string)
    "0x5fbe74a283f7954f10aa04c2edf55578811aeb03"           // zkgm deployer address on Base
);

console.log('ProxyAccount Address:', result.address);
console.log('Salt:', result.salt);