export const UNI_ROUTER_ABI = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_factory',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_WETH',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'WETH',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'factory',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'receive',
    stateMutability: 'payable',
  },
  {
    name: 'addLiquidity',
    type: 'function',
    inputs: [
      {
        name: 'tokenA',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenB',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountADesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountBDesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountAMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountBMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountA',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountB',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'addLiquidityETH',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountTokenDesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETHMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountToken',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETH',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    name: 'removeLiquidity',
    type: 'function',
    inputs: [
      {
        name: 'tokenA',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenB',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountAMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountBMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountA',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountB',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'removeLiquidityETH',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETHMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountToken',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETH',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'removeLiquidityWithPermit',
    type: 'function',
    inputs: [
      {
        name: 'tokenA',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenB',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountAMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountBMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'approveMax',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'v',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'r',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 's',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'amountA',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountB',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'removeLiquidityETHWithPermit',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETHMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'approveMax',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'v',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'r',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 's',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'amountToken',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETH',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'removeLiquidityETHSupportingFeeOnTransferTokens',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETHMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountETH',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETHMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'approveMax',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'v',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'r',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 's',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'amountETH',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapTokensForExactTokens',
    type: 'function',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountInMax',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    inputs: [
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
  },
  {
    name: 'swapTokensForExactETH',
    type: 'function',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountInMax',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapETHForExactTokens',
    type: 'function',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
  },
  {
    name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    type: 'function',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
    type: 'function',
    inputs: [
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
    type: 'function',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'quote',
    type: 'function',
    inputs: [
      {
        name: 'amountA',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'reserveA',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'reserveB',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountB',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'pure',
  },
  {
    name: 'getAmountOut',
    type: 'function',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'reserveIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'reserveOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'pure',
  },
  {
    name: 'getAmountIn',
    type: 'function',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'reserveIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'reserveOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'pure',
  },
  {
    name: 'getAmountsOut',
    type: 'function',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getAmountsIn',
    type: 'function',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
];
