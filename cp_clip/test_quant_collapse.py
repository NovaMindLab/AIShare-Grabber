import onnxruntime as ort
import numpy as np

def cosine_sim(a, b):
    a_norm = a / np.linalg.norm(a)
    b_norm = b / np.linalg.norm(b)
    return np.dot(a_norm, b_norm.T).item()

def test_models():
    print("Testing quantization collapse...")
    
    # Text input: tokenized "a photo of a dog" (padded to 77)
    # Using some dummy tokens for standard CLIP
    text_input = np.zeros((1, 77), dtype=np.int64)
    text_input[0, 0] = 49406  # start token
    text_input[0, 1] = 320    # 'a'
    text_input[0, 2] = 1125   # 'photo'
    text_input[0, 3] = 539    # 'of'
    text_input[0, 4] = 320    # 'a'
    text_input[0, 5] = 1929   # 'dog'
    text_input[0, 6] = 49407  # end token
    
    # 1. Run FP32 model
    print("Loading FP32 model...")
    session_fp32 = ort.InferenceSession('mobileclip2_s0_text_encoder.onnx')
    output_fp32 = session_fp32.run(None, {'input': text_input})[0]
    
    # 2. Run INT8 model
    print("Loading INT8 model...")
    session_int8 = ort.InferenceSession('mobileclip2_s0_text_encoder_quant.onnx')
    output_int8 = session_int8.run(None, {'input': text_input})[0]
    
    # 3. Compare similarity
    sim = cosine_sim(output_fp32[0], output_int8[0])
    print(f"Cosine Similarity between FP32 and INT8: {sim:.4f}")
    
    if sim < 0.95:
        print("WARNING: Severe quantization collapse detected!")
    else:
        print("PASS: Quantization maintained good precision.")

if __name__ == '__main__':
    test_models()
