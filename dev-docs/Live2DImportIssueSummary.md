# Live2D 资源导入渲染报错问题归纳

## 1. 问题现象
导入 Live2D 模型（模型文件完整度检测为 complete）并拖入场景后，控制台抛出如下未捕获错误：
```log
index.es.js:3603 Uncaught TypeError: Cannot read properties of null (reading 'source')
    at Live2DModel.resolveTextureForRender (index.es.js:3603:29)
    at Live2DModel.renderLive2D (index.es.js:3056:28)
```
同时在上方会伴随有一个 PixiJS 8 原生 Assets 系统的警告：
```log
warn.ts:23 PixiJS Warning: [Assets] blob:http://localhost:5173/xxxx-xxxx-xxxx could not be loaded as we don't know how to parse it, ensure the correct parser has been added
```

---

## 2. 根本原因分析

### PixiJS 8 的默认资源解析机制局限性
* PixiJS v8 的 Assets 管理系统默认依靠 **URL 后缀名**（例如 `.png`, `.jpg`, `.json`）来识别、分配和加载具体解析器（`LoadParser`）。
* 在网络或拖拽导入模式下，Live2D 模型的纹理贴图路径被重写为了类似 `blob:http://localhost:5173/c235d3b9-1845-461d-bf84-a3074c31683a` 的格式。
* 此类 Blob URL **不带任何文件后缀名**，且由于它是 Live2D 内部的 Loader 链条发起的 `Assets.load(blobUrl)` 请求，默认没有传入指定的 `{ parser: 'texture' }` 参数。
* 结果是 PixiJS 8 在测试所有的 `LoadParser` 时，其默认的图片匹配函数 `loadTextures.test` 因无法检测到 `.png` 后缀而返回 `false`。
* 最终导致该图片未能被成功作为纹理载入，变成了 `null`。Live2DModel 在每一帧执行 WebGL 渲染并提取纹理源时（`resolveTextureForRender`），读取空指针 `null.source` 最终导致画面崩溃。

---

## 3. 修复方案

我们通过扩展 PixiJS 8 自身的生命周期解决这一基础设计局限：

### 1. `BlobRegistry` 扩展格式追踪能力
在转换并创建 Blob URL 的地方（`BlobRegistry.js`），我们通过解析 Blob 底层的 MIME 媒体类型（例如 `blob.type`）记录该 UUID 对应的真实文件格式（如 `png`、`json`）：
```javascript
let format = '';
if (blob.type) {
    if (blob.type.includes('png')) format = 'png';
    else if (blob.type.includes('json')) format = 'json';
}
this.formats.set(url, format);
```

### 2. 注入全局自定义 `ResolveParser` 扩展
在 [main.js](file:///c:/Users/Administrator/Desktop/BaiNiaoGKD/appOriginal/FennecView/src/main.js) 中，向 PixiJS 8 架构注册全局的 `ResolveParser`。该拦截器会在资产加载前强制劫持所有 `blob:` 协议的请求：
```javascript
const blobResolveParser = {
    extension: PIXINamespace.ExtensionType.ResolveParser,
    test: (url) => typeof url === 'string' && url.startsWith('blob:'),
    parse: (url) => {
        const format = blobRegistry.getFormat(url);
        if (format) {
            let loadParser = '';
            if (format === 'png' || format === 'jpg' || format === 'webp') {
                loadParser = 'loadTextures';
            } else if (format === 'json') {
                loadParser = 'loadJson';
            }
            return {
                resolution: 1,
                format: format,
                loadParser: loadParser, // 显式指明使用的具体加载器，阻止 Pixi v8 后缀自动探测
                parser: loadParser,     // 兼容 Pixi v8.12+ 的简写方式
                src: url
            };
        }
        return { src: url };
    }
}
PIXINamespace.extensions.add(blobResolveParser);
```
通过返回明确 of `loadParser: 'loadTextures'`，直接指引 Assets 引擎应用纹理加载器，避开了后缀验证，从而让拖入的 Live2D 贴图成功生成渲染材质。
