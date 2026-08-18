import os
try:
    from onnxruntime.quantization import quantize_dynamic, QuantType
except ImportError:
    os.system("pip install onnxruntime")
    from onnxruntime.quantization import quantize_dynamic, QuantType

def do_quantize():
    model_fp32 = 'mobileclip2_s0_text_encoder.onnx'
    model_quant = 'mobileclip2_s0_text_encoder_quant.onnx'
    print("Quantizing Text Encoder...")
    quantize_dynamic(model_fp32, model_quant, weight_type=QuantType.QUInt8)
    print("Done!")

if __name__ == '__main__':
    do_quantize()
