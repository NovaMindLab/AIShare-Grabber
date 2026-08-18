import onnxruntime as ort
import numpy as np
import torch
import open_clip

def test():
    # Load PyTorch model
    model, _, preprocess = open_clip.create_model_and_transforms('MobileCLIP2-S0', pretrained='dfndr2b')
    tokenizer = open_clip.get_tokenizer('MobileCLIP2-S0')
    model.eval()

    text = "dog"
    tokens = tokenizer([text])
    
    with torch.no_grad():
        pt_emb = model.encode_text(tokens)
        pt_emb /= pt_emb.norm(dim=-1, keepdim=True)
        pt_emb = pt_emb[0].cpu().numpy()

    # Load ONNX model
    session = ort.InferenceSession('mobileclip2_s0_text_encoder.onnx')
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    onnx_inputs = {input_name: tokens.numpy().astype(np.int64)}
    onnx_outputs = session.run([output_name], onnx_inputs)
    onnx_emb = onnx_outputs[0][0]
    onnx_emb /= np.linalg.norm(onnx_emb)

    # Compare
    cos_sim = np.dot(pt_emb, onnx_emb)
    print(f"Cosine Similarity between PyTorch and ONNX text embeddings: {cos_sim:.4f}")
    print(f"Tokens: {tokens.numpy()}")

if __name__ == '__main__':
    test()
