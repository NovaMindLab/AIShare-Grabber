// AssemblyScript module for SIMD accelerated math operations

/**
 * Calculates cosine similarity between two vectors in linear memory using SIMD.
 * @param indexA The index of the first vector (in elements, e.g. 0 means 0th vector)
 * @param indexB The index of the second vector
 * @param length The dimension length of the vector (e.g. 512)
 * @returns Cosine similarity float
 */
export function cosine_similarity(indexA: i32, indexB: i32, length: i32): f32 {
  let ptrA = indexA * length * 4;
  let ptrB = indexB * length * 4;

  let dotProduct = f32x4.splat(0.0);

  let i = 0;
  // Unroll loop for v128 (4 floats at a time)
  for (; i <= length - 4; i += 4) {
    let a = v128.load(ptrA + i * 4);
    let b = v128.load(ptrB + i * 4);
    dotProduct = f32x4.add(dotProduct, f32x4.mul(a, b));
  }

  // Sum up the lanes
  let dotSum: f32 = f32x4.extract_lane(dotProduct, 0) +
                    f32x4.extract_lane(dotProduct, 1) +
                    f32x4.extract_lane(dotProduct, 2) +
                    f32x4.extract_lane(dotProduct, 3);
  
  // Handle any remaining elements (if length is not a multiple of 4)
  for (; i < length; ++i) {
    let a = load<f32>(ptrA + i * 4);
    let b = load<f32>(ptrB + i * 4);
    dotSum += a * b;
  }

  return dotSum;
}
