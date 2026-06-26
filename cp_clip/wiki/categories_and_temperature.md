# 分类优化：类别扩展与 Softmax 温度调节

本项目是一款通用本地相册分类应用。要获得优秀的日常相册归类体验，除了保证图像前处理及重参数化正确外，**分类词表的设计**以及 **Softmax 置信度平滑**同样起着决定性作用。

---

## 🔍 问题分析

### 1. 原 8 分类词表的局限性
早期的分类配置仅提供了 8 个基础分类：
`Landscape (风景)`、`Cityscape (城市)`、`Pets (宠物)`、`Food (美食)`、`Portrait (人像)`、`Document (文档)`、`Vehicles (车辆)`、`Shopping (商品)`。

当用户导入一张家庭生活或非这 8 类的日常照片时，CLIP 模型会被迫在 8 个类别中**挑选一个最不差的**。例如：
*   一张**马桶/卫生间**照片：因为原词表中没有室内或家居大类，马桶在颜色、质感和白色陶瓷特征上与餐盘、杯子最为接近，因而最终被判定为“美食与饮品”。
*   一张**显示器/数码产品**照片：因为没有数码设备大类，被归类为“美食与饮品”或“商品与购物”。

### 2. Softmax 温度过高的弊端
在计算各个类别的百分比概率时，早期代码直接借用了标准 CLIP 训练时的 logits 缩放尺度：
```javascript
const temperature = 100.0;
const expScores = similarities.map(s => ({
  exp: Math.exp(s.score * temperature)
}));
```
在只有少数类别（如 8 类或 15 类）且所有类别的余弦相似度都极其微弱且接近（例如最不相似的为 `0.04`，稍微有一点点接近的为 `0.08`）的情况下，乘以 `100.0` 的温度值会将这两者的微小差距无限放大：
$$e^{0.08 \times 100} = e^{8} \approx 2980$$
$$e^{0.04 \times 100} = e^{4} \approx 54$$
计算 Softmax 后，稍微高出一点点的类别会被放大到 **70% 以上的置信度**，使得界面上呈现出一种“错误却非常自信”的糟糕状态。

---

## 🛠️ 解决方案

为了解决上述缺陷，我们对分类大类进行了针对性的词表扩展，并对概率分布进行了温度微调。

### 1. 扩展至 15 大常用相册类别
我们在 `extract_embeddings.py` 中将分类增加至 **15 个**，完全覆盖绝大多数日常相册中的典型场景，并使用更精确的英文 Prompt 提示词进行嵌入提取：

```python
category_prompts = {
    # 风景、建筑、动物、美食、人像、文档、交通工具、购物
    "🏞️ 乡村与自然风景 (Landscape)": "a photo of natural landscape, countryside, scenery, mountains, forest, or beach",
    "🏙️ 城市与建筑 (Cityscape)": "a photo of a city street, skyscrapers, urban architecture, or building exterior",
    "🐱 宠物与动物 (Pets & Animals)": "a photo of a pet, dog, cat, animal, bird, or wildlife",
    "🍜 美食与饮品 (Food & Drinks)": "a photo of food, cooked meal, dessert, coffee, or beverage",
    "🧑 人像与自拍 (Portrait)": "a photo of a person, close-up portrait, face, selfie, or group of people",
    "📄 文档与证件截图 (Document)": "a screenshot of text page, document, mobile app screen, ID card, or receipt",
    "🚗 车辆与交通工具 (Vehicles)": "a photo of a car, truck, motorcycle, bus, bicycle, or traffic",
    "🛍️ 商品与购物 (Shopping)": "a photo of a product, commercial item, shop display, clothes, or shopping bag",
    
    # 新增日常生活大类 (极大地提升了日常杂物/生活照的归类精准度)
    "🏠 家居与室内 (Home & Indoors)": "a photo of a room, indoor scene, furniture, kitchen, bathroom, toilet, or bedroom",
    "💻 电脑与数码 (Electronics & Tech)": "a photo of a computer screen, laptop, mobile phone, keyboard, or electronic device",
    "🌸 花卉与植物 (Flowers & Plants)": "a photo of flowers, plants, garden, or leaves",
    "🎨 艺术与设计 (Art & Design)": "a photo of a drawing, painting, illustration, poster, or graphic design",
    "⚽ 运动与健康 (Sports & Fitness)": "a photo of sports, exercise, fitness, stadium, or athletic activity",
    "🎸 乐器与音乐 (Music & Instruments)": "a photo of a musical instrument, guitar, piano, drums, or music concert",
    "🧸 玩偶与玩具 (Toys & Dolls)": "a photo of a toy, doll, stuffed animal, action figure, or board game"
}
```

### 2. 调平 Softmax 置信度
我们在主进程 `main.cjs` 中，将 Softmax 缩放因子由 `100.0` 调整为 **`60.0`**。
*   **低置信度时**：当所有类别的余弦相似度普遍较低且相差极小时，Softmax 结果将比较平缓（如最高概率只有 20%~30%），直观展示模型的“不确定性”，避免给用户带来虚假的高概率误判。
*   **高置信度时**：当存在真正匹配的类别时（如马桶对应 Home & Indoors 相似度为 `0.2372`，其它只有 `0.10` 左右），`60.0` 的缩放值依然能稳定输出 `98%` 以上的极高确定性概率。

---

## 📈 改造效果

以相同的马桶照片（`01e59e16977e9e7584f51d7ded03d804.png`）作为输入：

*   **旧分类与温度**：没有合适的大类可选，马桶被强行分类为 **🍜 美食与饮品 (71.0%)**。
*   **新分类与温度**：模型找到了最匹配的分类，以 **🏠 家居与室内 (98.65%)** 高分胜出，而误分类为“美食与饮品”的概率降到了 **0.14%**。
