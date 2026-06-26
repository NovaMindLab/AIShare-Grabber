import os
import json
import torch
import torch.nn as nn
import sys

# Reconfigure stdout to support UTF-8 characters (like emojis) on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    import mobileclip
except ImportError:
    print("Warning: 'mobileclip' package is not installed. To run this script, please install it via:")
    print("pip install git+https://github.com/apple/ml-mobileclip.git")
    print("Or see: https://github.com/apple/ml-mobileclip")

def safe_reparameterize_model(model: nn.Module) -> nn.Module:
    """Safely reparameterize the model without crashing on already reparameterized layers or double-calls."""
    for name, module in model.named_modules():
        if hasattr(module, "reparameterize"):
            class_name = module.__class__.__name__
            # Skip layers that are already reparameterized
            if class_name == "RepMixer":
                if hasattr(module, "reparam_conv") or not hasattr(module, "mixer"):
                    print(f" -> Skipping already reparameterized RepMixer: {name}")
                    continue
            elif class_name == "ReparamLargeKernelConv":
                if hasattr(module, "lkb_reparam") or not hasattr(module, "lkb_origin"):
                    print(f" -> Skipping already reparameterized ReparamLargeKernelConv: {name}")
                    continue
            elif class_name == "RepCPE":
                if hasattr(module, "reparam_conv") or not hasattr(module, "pe"):
                    print(f" -> Skipping already reparameterized RepCPE: {name}")
                    continue
            
            try:
                module.reparameterize()
                if class_name == "RepMixer":
                    module.inference_mode = True
                print(f" -> Reparameterized: {name} ({class_name})")
            except Exception as e:
                print(f" -> Warning: Failed to reparameterize {name} ({class_name}): {e}")
    return model

def export_model_and_embeddings():
    # 1. Configuration
    model_name = 'mobileclip_s0'  # Or 'mobileclip_s1'
    pretrained_checkpoint = 'mobileclip_s0.pt'  # Path to download/local checkpoint file
    
    # 2. Define Category Labels and Prompts
    # We map Chinese classification names to descriptive English prompt templates for better CLIP mapping.
    category_prompts = {
        "🏞️ 乡村与自然风景 (Landscape)": "a photo of natural landscape, countryside, scenery, mountains, forest, or beach",
        "🏙️ 城市与建筑 (Cityscape)": "a photo of a city street, skyscrapers, urban architecture, or building exterior",
        "🐱 宠物与动物 (Pets & Animals)": "a photo of a pet, dog, cat, animal, bird, or wildlife",
        "🍜 美食与饮品 (Food & Drinks)": "a photo of food, cooked meal, dessert, coffee, or beverage",
        "🧑 人像与自拍 (Portrait)": "a photo of a person, close-up portrait, face, selfie, or group of people",
        "📄 文档与证件截图 (Document)": "a screenshot of text page, document, mobile app screen, ID card, or receipt",
        "🚗 车辆与交通工具 (Vehicles)": "a photo of a car, truck, motorcycle, bus, bicycle, or traffic",
        "🛍️ 商品与购物 (Shopping)": "a photo of a product, commercial item, shop display, clothes, or shopping bag",
        "🏠 家居与室内 (Home & Indoors)": "a photo of a room, indoor scene, furniture, kitchen, bathroom, toilet, or bedroom",
        "💻 电脑与数码 (Electronics & Tech)": "a photo of a computer screen, laptop, mobile phone, keyboard, or electronic device",
        "🌸 花卉与植物 (Flowers & Plants)": "a photo of flowers, plants, garden, or leaves",
        "🎨 艺术与设计 (Art & Design)": "a photo of a drawing, painting, illustration, poster, or graphic design",
        "⚽ 运动与健康 (Sports & Fitness)": "a photo of sports, exercise, fitness, stadium, or athletic activity",
        "🎸 乐器与音乐 (Music & Instruments)": "a photo of a musical instrument, guitar, piano, drums, or music concert",
        "🧸 玩偶与玩具 (Toys & Dolls)": "a photo of a toy, doll, stuffed animal, action figure, or board game"
    }

    print(f"Loading MobileCLIP model: {model_name}...")
    # Load model and tokenizer
    model, _, preprocess = mobileclip.create_model_and_transforms(
        model_name, 
        pretrained=pretrained_checkpoint
    )
    tokenizer = mobileclip.get_tokenizer(model_name)
    model.eval()

    # Reparameterize MobileOne backbone for optimal inference execution
    print("Safely reparameterizing MobileCLIP model for optimal inference...")
    model = safe_reparameterize_model(model)

    # 3. Extract Text Embeddings
    print("Extracting text features for categories...")
    text_embeddings = {}
    
    with torch.no_grad():
        for category, prompt in category_prompts.items():
            # Tokenize and encode
            tokens = tokenizer([prompt])
            text_features = model.encode_text(tokens)
            
            # L2 Normalize text embeddings as required for Cosine Similarity
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            # Save 512-dim embedding as list of floats
            embedding_vector = text_features[0].cpu().numpy().tolist()
            text_embeddings[category] = embedding_vector
            print(f" -> Embedded '{category}' (Dimension: {len(embedding_vector)})")

    # Save to text_embeddings.json
    output_json_path = 'text_embeddings.json'
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(text_embeddings, f, indent=2, ensure_ascii=False)
    print(f"Successfully saved text embeddings to: {os.path.abspath(output_json_path)}")

    # 4. Export Image Encoder to ONNX
    print("Exporting Image Encoder to ONNX...")
    image_encoder = model.image_encoder
    
    # MobileCLIP-S0/S1 default resolution is 256x256. 
    # Input tensor shape: [batch_size, channels, height, width]
    dummy_input = torch.randn(1, 3, 256, 256)
    onnx_output_path = "mobileclip_image_encoder.onnx"
    
    torch.onnx.export(
        image_encoder,
        dummy_input,
        onnx_output_path,
        export_params=True,
        opset_version=15,
        input_names=['image'],
        output_names=['image_features'],
        dynamic_axes={
            'image': {0: 'batch_size'},
            'image_features': {0: 'batch_size'}
        }
    )
    print(f"Successfully exported ONNX image encoder model to: {os.path.abspath(onnx_output_path)}")

    # 5. Check if external weights were generated and merge them into a single self-contained ONNX file
    external_data_path = onnx_output_path + ".data"
    if os.path.exists(external_data_path):
        print("Merging external weights into a single self-contained ONNX file...")
        import onnx
        model_proto = onnx.load(onnx_output_path)
        temp_flat_path = onnx_output_path + ".flat"
        onnx.save(model_proto, temp_flat_path)
        os.remove(onnx_output_path)
        os.remove(external_data_path)
        os.rename(temp_flat_path, onnx_output_path)
        print("ONNX model flattened and self-contained successfully.")

    print("Preparation Phase complete!")

if __name__ == "__main__":
    # Ensure dependencies are loaded
    try:
        export_model_and_embeddings()
    except Exception as e:
        print(f"\nError occurred: {e}")
        print("Please verify your Python environment has 'torch' and 'mobileclip' installed correctly.")
