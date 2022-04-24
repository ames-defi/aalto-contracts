export const ERC20_ABI = [
  {
    payable: false,
    type: 'constructor',
    inputs: [
      {
        internalType: 'address',
        type: 'address',
        name: '_ethTokenAddr',
      },
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
      },
      {
        internalType: 'uint8',
        name: 'decimals',
        type: 'uint8',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    inputs: [
      {
        internalType: 'address',
        indexed: true,
        type: 'address',
        name: 'owner',
      },
      {
        type: 'address',
        indexed: true,
        name: 'spender',
        internalType: 'address',
      },
      {
        type: 'uint256',
        name: 'value',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    name: 'Approval',
    anonymous: false,
  },
  {
    name: 'MinterAdded',
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        indexed: true,
        type: 'address',
      },
    ],
    anonymous: false,
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
    anonymous: false,
    name: 'MinterRemoved',
    type: 'event',
  },
  {
    name: 'Transfer',
    inputs: [
      {
        internalType: 'address',
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        name: 'to',
        indexed: true,
        type: 'address',
        internalType: 'address',
      },
      {
        indexed: false,
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    type: 'event',
    anonymous: false,
  },
  {
    name: 'addMinter',
    payable: false,
    constant: false,
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    name: 'allowance',
    constant: true,
    type: 'function',
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        internalType: 'address',
        name: 'owner',
      },
      {
        name: 'spender',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        type: 'uint256',
        internalType: 'uint256',
        name: '',
      },
    ],
  },
  {
    constant: false,
    name: 'approve',
    stateMutability: 'nonpayable',
    type: 'function',
    payable: false,
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    inputs: [
      {
        type: 'address',
        internalType: 'address',
        name: 'spender',
      },
      {
        type: 'uint256',
        internalType: 'uint256',
        name: 'amount',
      },
    ],
  },
  {
    constant: true,
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        type: 'uint256',
        name: '',
      },
    ],
    inputs: [
      {
        internalType: 'address',
        type: 'address',
        name: 'account',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    outputs: [],
    name: 'burn',
    type: 'function',
    constant: false,
    payable: false,
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    stateMutability: 'nonpayable',
    name: 'burnFrom',
    payable: false,
    outputs: [],
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    constant: false,
    type: 'function',
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    payable: false,
    outputs: [
      {
        name: '',
        internalType: 'uint8',
        type: 'uint8',
      },
    ],
    constant: true,
    inputs: [],
  },
  {
    payable: false,
    constant: false,
    name: 'decreaseAllowance',
    inputs: [
      {
        name: 'spender',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'subtractedValue',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    type: 'function',
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    inputs: [],
    outputs: [
      {
        internalType: 'address',
        type: 'address',
        name: '',
      },
    ],
    type: 'function',
    payable: false,
    stateMutability: 'view',
    name: 'ethTokenAddr',
    constant: true,
  },
  {
    constant: false,
    type: 'function',
    payable: false,
    name: 'increaseAllowance',
    inputs: [
      {
        type: 'address',
        internalType: 'address',
        name: 'spender',
      },
      {
        internalType: 'uint256',
        type: 'uint256',
        name: 'addedValue',
      },
    ],
    outputs: [
      {
        name: '',
        internalType: 'bool',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    constant: true,
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    name: 'isMinter',
    type: 'function',
  },
  {
    payable: false,
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    name: 'mint',
    constant: false,
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
      {
        internalType: 'uint256',
        type: 'uint256',
        name: 'amount',
      },
    ],
    type: 'function',
  },
  {
    name: 'name',
    outputs: [
      {
        name: '',
        internalType: 'string',
        type: 'string',
      },
    ],
    payable: false,
    constant: true,
    stateMutability: 'view',
    inputs: [],
    type: 'function',
  },
  {
    payable: false,
    inputs: [],
    stateMutability: 'nonpayable',
    outputs: [],
    constant: false,
    name: 'renounceMinter',
    type: 'function',
  },
  {
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    payable: false,
    name: 'symbol',
    constant: true,
    type: 'function',
    inputs: [],
    stateMutability: 'view',
  },
  {
    constant: true,
    inputs: [],
    payable: false,
    stateMutability: 'view',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'totalSupply',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        type: 'address',
        name: 'recipient',
      },
      {
        type: 'uint256',
        internalType: 'uint256',
        name: 'amount',
      },
    ],
    type: 'function',
    name: 'transfer',
    payable: false,
    outputs: [
      {
        type: 'bool',
        name: '',
        internalType: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'transferFrom',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        type: 'bool',
        internalType: 'bool',
        name: '',
      },
    ],
    type: 'function',
    stateMutability: 'nonpayable',
    constant: false,
    payable: false,
  },
];
