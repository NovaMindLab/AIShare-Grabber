import onnxruntime as ort
import numpy as np
import torch
import open_clip
from PIL import Image

def test():
    print("Loading PyTorch model...")
    model, _, preprocess = open_clip.create_model_and_transforms('MobileCLIP2-S0', pretrained='dfndr2b')
    model.eval()

    # Create dummy image array (black image)
    dummy_img = Image.new('RGB', (256, 256), color = (100, 100, 100))
    pt_input = preprocess(dummy_img).unsqueeze(0)
    
    with torch.no_grad():
        pt_emb = model.encode_image(pt_input)
        pt_emb = pt_emb[0].cpu().numpy()

    print("Loading ONNX model...")
    session = ort.InferenceSession('mobileclip2_s0_image_encoder.onnx')
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    onnx_input = pt_input.cpu().numpy().astype(np.float32)
    onnx_outputs = session.run([output_name], {input_name: onnx_input})
    onnx_emb = onnx_outputs[0][0]

    cos_sim = np.dot(pt_emb, onnx_emb) / (np.linalg.norm(pt_emb) * np.linalg.norm(onnx_emb))
    print(f"Cosine Similarity between PyTorch and ONNX image embeddings: {cos_sim:.4f}")

if __name__ == '__main__':
    test()
