# 📑 ShareCLIP 核心技术议题调研与决策白皮书 (Meeting Topics Wiki)

本目录收录了关于 **ShareCLIP (Image Clip)** 核心架构演进、AI 推理选型、性能量化基准与工程落地的 8 项核心调研报告：

---

## 📑 调研报告索引导航

| 序号 | 报告主题 | 核心结论与亮点 | 详细白皮书链接 |
| :---: | :--- | :--- | :--- |
| **01** | **新旧模型框架性能对比** | ONNX Runtime CPU / DirectML / OpenVINO / TensorRT 吞吐量与时延实测，单图 76ms，多 Worker 达 48+ FPS | [01_model_framework_performance_comparison.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/01_model_framework_performance_comparison.md) |
| **02** | **图像分类精度与速度** | ImageNet 零样本 Top-1 达 70.4%，15 类真实相册加权准确率 91.8%，端到端全链路耗时拆解 | [02_image_classification_accuracy_and_latency.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/02_image_classification_accuracy_and_latency.md) |
| **03** | **新推理框架替代可行性** | 评估 ORT / OpenVINO / LibTorch / TFLite / GGML 算子覆盖与热降级，维持 ORT 最佳 | [03_inference_framework_migration_feasibility.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/03_inference_framework_migration_feasibility.md) |
| **04** | **多线程与多任务并发** | 独立 Session 隔离 + SharedArrayBuffer 零拷贝无锁单写多读模型，WebRTC 心跳 0 丢包 | [04_multithreading_and_task_concurrency.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/04_multithreading_and_task_concurrency.md) |
| **05** | **Prompt 设计与多语言支持** | 官方推荐集成模板工程 (Ensembling)、Softmax 温度系数调校 ($T=0.01$) 与 20+ 语言搜索 | [05_prompt_engineering_and_multilingual.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/05_prompt_engineering_and_multilingual.md) |
| **06** | **安装包体积与竞品对比** | 整包严格控制在 **~168 MB**（达成 $\le 200\text{MB}$ 目标），对比 Immich(2.5G) / Mylio(420M) 具绝对便携优势 | [06_installer_bundle_size_and_competitor_analysis.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/06_installer_bundle_size_and_competitor_analysis.md) |
| **07** | **MobileCLIP2-S0 指标复核** | 2025 年最新 TMLR 成果复现，ImageNet Top-1 较 v1 提升 2.6%，重参数化与 INT8 导出验证 | [07_mobileclip2_s0_metrics_and_evaluation.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/07_mobileclip2_s0_metrics_and_evaluation.md) |
| **08** | **桌面架构选型 (Electron/Tauri/Flutter)** | 评估性能、体积、AI 扩展与迁移成本，维持 Electron 为当前 ROI 最高且最稳固的方案 | [08_desktop_framework_selection_electron_tauri_flutter.md](file:///d:/AI_serach_image/image_clip_android/wiki_work/08_desktop_framework_selection_electron_tauri_flutter.md) |
