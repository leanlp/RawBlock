import { toFeeBands } from '../lib/feeBands';

const mockBlocks = [
  {
    medianFee: 10,
    feeRange: [5, 10, 15, 20, 25, 30]
  },
  {
    medianFee: 5,
    feeRange: [1, 2, 3, 4, 5, 8]
  }
];

const mockBlocksVarying = [
  {
    medianFee: 50,
    feeRange: [50] // sparse range
  },
  {
    medianFee: 20,
    feeRange: [] // empty range
  }
];

function test() {
  console.log('Testing toFeeBands with full range:');
  const bands1 = toFeeBands(mockBlocks);
  console.log(JSON.stringify(bands1, null, 2));
  bands1.forEach((band, index) => {
    if (!(band.low <= band.median && band.median <= band.high)) {
      throw new Error(`Band ordering failed at index ${index} for full range test`);
    }
  });

  console.log('\nTesting toFeeBands with varying/sparse range:');
  const bands2 = toFeeBands(mockBlocksVarying);
  console.log(JSON.stringify(bands2, null, 2));
  bands2.forEach((band, index) => {
    if (!(band.low <= band.median && band.median <= band.high)) {
      throw new Error(`Band ordering failed at index ${index} for sparse range test`);
    }
  });

  console.log('\nAll monotonic ordering assertions passed.');
}

test();
